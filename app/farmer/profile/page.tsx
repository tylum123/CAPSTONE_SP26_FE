"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, MapPin, CalendarDays, Edit, UserCircle, Loader2, MessageCircle } from "lucide-react";
import { farmerService } from "@/libs/api/services/farmer.service";
import type { FarmerProfile } from "@/libs/types";
import { format } from "date-fns";
import { useAuth } from "@/libs/stores/auth.store";

export default function FarmerProfilePage() {
    const [profile, setProfile] = useState<FarmerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const response = await farmerService.getProfile();
                setProfile(response.data);
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-4xl space-y-6 pt-6">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
                <UserCircle className="h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-xl font-bold">Không tìm thấy thông tin hồ sơ</h2>
                <p className="text-muted-foreground max-w-md">
                    Có vẻ như bạn chưa thiết lập thông tin cá nhân.
                </p>
                <Button asChild className="bg-agro-green hover:bg-agro-green-dark">
                    <Link href="/farmer/setup-profile">Bắt đầu thiết lập</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-500">
            {/* Header Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-8 border border-emerald-100 shadow-sm">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl opacity-50" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                        <AvatarImage src={profile.avatarUrl || "/placeholder.svg"} className="object-cover" />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-3xl font-bold">
                            {profile.contactName?.charAt(0).toUpperCase() || "NA"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                        <h1 className="text-3xl font-bold text-slate-800">{profile.contactName || "Chưa cập nhật tên"}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-600 font-medium">
                            {profile.address && (
                                <div className="flex items-center">
                                    <MapPin className="mr-1.5 h-4 w-4 text-emerald-500" />
                                    <span>{profile.address}</span>
                                </div>
                            )}
                        </div>
                        {/* <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 mt-2">
                            Đang hoạt động
                        </span> */}
                    </div>

                    <div className="flex gap-3 md:self-start mt-4 md:mt-0">
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                            <Link href="/farmer/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                Cài đặt
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="bg-white/80 hover:bg-white text-slate-700 border-slate-200 shadow-sm">
                            <Link href="/farmer/messages">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Tin nhắn
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-0 shadow-sm border-slate-100 bg-white/70">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-emerald-600" />
                            Thông tin liên hệ
                        </CardTitle>
                        <CardDescription>Chi tiết liên hệ của bạn</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-1">
                            <span className="text-sm font-medium text-slate-500">Người liên hệ</span>
                            <span className="text-base text-slate-900 font-semibold">{profile.contactName || "—"}</span>
                        </div>
                        {profile.dateOfBirth && (
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-slate-500">Ngày sinh</span>
                                <span className="text-base text-slate-900 flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-slate-400" />
                                    {format(new Date(profile.dateOfBirth), "dd/MM/yyyy")}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm border-slate-100 bg-white/70">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-teal-600" />
                            Địa chỉ & Khác
                        </CardTitle>
                        <CardDescription>Vị trí trang trại thường trú</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-1">
                            <span className="text-sm font-medium text-slate-500">Địa chỉ hiện tại</span>
                            <span className="text-base text-slate-900">{profile.address || "—"}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
