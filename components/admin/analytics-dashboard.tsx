'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import {
    addDays,
    format,
    isWithinInterval,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subDays,
    subMonths,
    subWeeks
} from 'date-fns';
import { Calendar as CalendarIcon, Loader2, TrendingUp, Users, ShoppingBag, CreditCard, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';

interface Order {
    id: string;
    orderId?: string;
    totalAmount: number;
    createdAt: any;
    status: string;
    items: any[];
}

interface Book {
    id: string;
    title: string;
    stockQuantity: number;
    stock?: number; // legacy
    price: number;
    originalPrice?: number;
    category: string;
}

export function AnalyticsDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [timeFilter, setTimeFilter] = useState('30days');
    const [inventoryBasis, setInventoryBasis] = useState<'selling' | 'original'>('selling');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Orders
            try {
                const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
                const ordersSnapshot = await getDocs(ordersQuery);
                const ordersData = ordersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Order[];
                setOrders(ordersData);
            } catch (orderError) {
                console.error("Error fetching orders:", orderError);
            }

            // Fetch Books (Inventory)
            try {
                const booksSnapshot = await getDocs(collection(db, 'books'));
                const booksData = booksSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Book[];
                setBooks(booksData);
            } catch (bookError) {
                console.error("Error fetching books:", bookError);
            }

        } catch (error) {
            console.error("Error in dashboard fetch:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTimeFilterChange = (value: string) => {
        setTimeFilter(value);
        const today = new Date();
        switch (value) {
            case 'today':
                setDateRange({ from: startOfDay(today), to: endOfDay(today) });
                break;
            case 'week':
                setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
                break;
            case 'month':
                setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
                break;
            case '7days':
                setDateRange({ from: subDays(today, 7), to: today });
                break;
            case '30days':
                setDateRange({ from: subDays(today, 30), to: today });
                break;
            case '90days':
                setDateRange({ from: subDays(today, 90), to: today });
                break;
            case 'year':
                setDateRange({ from: subDays(today, 365), to: today });
                break;
            default:
                // Custom range is handled by the date picker
                break;
        }
    };

    // Filter orders based on date range
    const filteredOrders = useMemo(() => {
        if (!dateRange?.from) return orders;

        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(from);

        return orders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            return orderDate >= from && orderDate <= to;
        });
    }, [orders, dateRange]);

    // Aggregate data for charts
    const chartData = useMemo(() => {
        if (!filteredOrders.length) return [];

        const groupedData: Record<string, { date: string; sales: number; orders: number }> = {};

        filteredOrders.forEach(order => {
            const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            const dateKey = format(orderDate, 'MMM dd'); // Group by day

            if (!groupedData[dateKey]) {
                groupedData[dateKey] = { date: dateKey, sales: 0, orders: 0 };
            }
            groupedData[dateKey].sales += order.totalAmount;
            groupedData[dateKey].orders += 1;
        });

        // Simple sort by date for display
        return Object.values(groupedData).reverse();
    }, [filteredOrders]);

    // Stats
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Inventory Stats
    const lowStockBooks = books.filter(b => (b.stockQuantity ?? b.stock ?? 0) < 5);
    const outOfStockBooks = books.filter(b => (b.stockQuantity ?? b.stock ?? 0) <= 0);

    // Calculate Inventory Value based on selection
    const totalInventoryValue = books.reduce((sum, b) => {
        const quantity = b.stockQuantity ?? b.stock ?? 0;
        const value = inventoryBasis === 'selling'
            ? b.price
            : (b.originalPrice || b.price); // Fallback to price if originalPrice not set
        return sum + (value * quantity);
    }, 0);

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Analytics Overview</h2>
                    <p className="text-sm text-muted-foreground">Performance metrics for your store</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-colors">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-lg">
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                            <SelectItem value="90days">Last 3 Months</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>


                    {timeFilter === 'custom' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full sm:w-[260px] justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                        <div className="p-2 bg-green-50 rounded-full">
                            <CreditCard className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">₹{totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            <span className="text-green-600">↗</span> In selected period
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Orders</CardTitle>
                        <div className="p-2 bg-blue-50 rounded-full">
                            <ShoppingBag className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">+{totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            In selected period
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Avg. Order Value</CardTitle>
                        <div className="p-2 bg-purple-50 rounded-full">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">₹{Math.round(averageOrderValue).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            Per order
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Inventory Value</CardTitle>
                        <div className="p-2 bg-orange-50 rounded-full">
                            <Users className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">₹{totalInventoryValue.toLocaleString()}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground font-medium">
                                Based on {inventoryBasis} price
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card className="col-span-4 rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800">Revenue Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `₹${value}`}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <Tooltip
                                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#8884d8"
                                            fillOpacity={1}
                                            fill="url(#colorSales)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4 rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all duration-300">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-800">Orders Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <XAxis
                                                dataKey="date"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                                            />
                                            <Bar dataKey="orders" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="col-span-3 rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all duration-300">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-800">Recent Sales</CardTitle>
                                <CardDescription>
                                    Latest transactions from your store.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {filteredOrders.slice(0, 5).map(order => (
                                        <div key={order.id} className="flex items-center">
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">Order #{order.orderId || order.id.slice(0, 8)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.items.length} items
                                                </p>
                                            </div>
                                            <div className="ml-auto font-medium">+₹{order.totalAmount.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                    <div className="flex items-center justify-end space-x-2 mb-4">
                        <Label htmlFor="inventory-basis" className="text-sm text-muted-foreground mr-2">
                            Calculate Value Based On:
                        </Label>
                        <div className="flex items-center border rounded-md p-1 bg-muted/20">
                            <Button
                                variant={inventoryBasis === 'selling' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setInventoryBasis('selling')}
                                className="h-7 text-xs"
                            >
                                Selling Price
                            </Button>
                            <Button
                                variant={inventoryBasis === 'original' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setInventoryBasis('original')}
                                className="h-7 text-xs"
                            >
                                Original Price
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{books.length}</div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{lowStockBooks.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Less than 5 items</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Out of Stock</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{outOfStockBooks.length}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-2xl shadow-sm border-gray-100 bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800">Low Stock Alert</CardTitle>
                            <CardDescription>Items that need restocking soon</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {lowStockBooks.length > 0 ? (
                                    lowStockBooks.map(book => (
                                        <div key={book.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-gray-900">{book.title}</p>
                                                <p className="text-sm text-muted-foreground">Category: {book.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${(book.stockQuantity ?? book.stock ?? 0) === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                                    {book.stockQuantity ?? book.stock ?? 0} left
                                                </p>
                                                <p className="text-xs text-muted-foreground">Price: ₹{book.price}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">All items are well stocked.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
