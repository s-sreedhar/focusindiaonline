'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Package, UserPlus, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AdminNotification,
    subscribeToUnreadNotifications,
    markAsRead,
    markAllAsRead
} from '@/lib/services/notifications';
import { cn } from '@/lib/utils'; // Assuming cn exists

function NotificationIcon({ type }: { type: AdminNotification['type'] }) {
    switch (type) {
        case 'new_order':
            return <Package className="h-4 w-4 text-blue-500" />;
        case 'new_customer':
            return <UserPlus className="h-4 w-4 text-green-500" />;
        case 'potential_lead':
            return <FileText className="h-4 w-4 text-orange-500" />;
        default:
            return <Bell className="h-4 w-4 text-gray-500" />;
    }
}

export function NotificationsBell() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = subscribeToUnreadNotifications((data) => {
            setNotifications(data);
        });
        return () => unsubscribe();
    }, []);

    const handleNotificationClick = async (notification: AdminNotification) => {
        try {
            await markAsRead(notification.id!);
            setIsOpen(false); // Close popover

            if (notification.entityId) {
                if (notification.type === 'new_order' || notification.type === 'potential_lead') {
                    router.push(`/admin/orders`);
                } else if (notification.type === 'new_customer') {
                    router.push(`/admin/users`);
                }
            }
        } catch (error) {
            //console.error("Error handling notification click:", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            //console.error("Error marking all as read:", error);
        }
    };

    const unreadCount = notifications.length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-full">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 h-3 w-3 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-xl" align="end">
                <div className="flex items-center justify-between p-4 border-b bg-muted/20">
                    <div>
                        <h4 className="font-semibold leading-none">Notifications</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                            {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={handleMarkAllRead}
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center h-full text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No new notifications</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((note) => (
                                <button
                                    key={note.id}
                                    className={cn(
                                        "flex flex-col w-full text-left p-4 border-b last:border-0",
                                        "hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50"
                                    )}
                                    onClick={() => handleNotificationClick(note)}
                                >
                                    <div className="flex justify-between items-start w-full mb-1">
                                        <div className="flex items-center gap-2 font-medium text-sm">
                                            <NotificationIcon type={note.type} />
                                            <span>{note.type === 'new_order' ? 'New Order' :
                                                note.type === 'new_customer' ? 'New Customer' :
                                                    note.type === 'potential_lead' ? 'Potential Lead' : 'Notification'}</span>
                                        </div>
                                        {note.createdAt && (
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                {formatDistanceToNow(
                                                    typeof note.createdAt.toDate === 'function' ? note.createdAt.toDate() : new Date(),
                                                    { addSuffix: true }
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold mb-1">{note.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{note.message}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {/* View All / History Link could go here */}
            </PopoverContent>
        </Popover>
    );
}
