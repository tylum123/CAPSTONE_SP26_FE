"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, MapPin, CalendarDays, UserCircle, MessageCircle, AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Eye, RefreshCw, Plus } from "lucide-react";
import { farmerService } from "@/libs/api/services/farmer.service";
import { DisputeStatus, DisputeType, JobPostStatus } from "@/libs/types";
import type { DisputeReportCommentDTO, DisputeReportDTO, FarmerProfile, GetFarmResponse, Job } from "@/libs/types";
import { format } from "date-fns";
import { disputeService, FarmService, jobService } from "@/libs/api";
import { toast } from "sonner";

export default function FarmerProfilePage() {
    const [profile, setProfile] = useState<FarmerProfile | null>(null);
    const [defaultFarmInfo, setDefaultFarmInfo] = useState<GetFarmResponse | null>(null);
    const [myDisputes, setMyDisputes] = useState<DisputeReportDTO[]>([]);
    const [isDisputesOpen, setIsDisputesOpen] = useState(true);
    const [isLoadingDisputes, setIsLoadingDisputes] = useState(false);
    const [isCreateDisputeDialogOpen, setIsCreateDisputeDialogOpen] = useState(false);
    const [isCreatingDispute, setIsCreatingDispute] = useState(false);
    const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
    const [isLoadingDisputeDetail, setIsLoadingDisputeDetail] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState<DisputeReportDTO | null>(null);
    const [selectedDisputeComments, setSelectedDisputeComments] = useState<DisputeReportCommentDTO[]>([]);
    const [jobSearchKeyword, setJobSearchKeyword] = useState("");
    const [jobSearchResults, setJobSearchResults] = useState<Job[]>([]);
    const [isSearchingJobs, setIsSearchingJobs] = useState(false);
    const [jobSearchPage, setJobSearchPage] = useState(1);
    const [jobSearchTotalPages, setJobSearchTotalPages] = useState(1);
    const [selectedJobWorkers, setSelectedJobWorkers] = useState<{
        workerId: string;
        fullName: string;
        phoneNumber: string;
        avatarUrl: string;
    }[]>([]);
    const [newDisputeForm, setNewDisputeForm] = useState({
        jobPostId: "",
        jobPostTitle: "",
        workerId: "",
        disputeTypeId: DisputeType.JobQuality,
        reason: "",
        description: "",
        evidenceUrl: "",
    });
    const [isLoading, setIsLoading] = useState(true);

    const getDisputeStatusLabel = (statusId: number) => {
        switch (statusId) {
            case DisputeStatus.Pending:
                return "Chờ xử lý";
            case DisputeStatus.UnderReview:
                return "Đang xem xét";
            case DisputeStatus.Resolved:
                return "Đã giải quyết";
            case DisputeStatus.Rejected:
                return "Đã từ chối";
            default:
                return `Trạng thái #${statusId}`;
        }
    };

    const resetCreateDisputeForm = () => {
        setNewDisputeForm({
            jobPostId: "",
            jobPostTitle: "",
            workerId: "",
            disputeTypeId: DisputeType.JobQuality,
            reason: "",
            description: "",
            evidenceUrl: "",
        });
        setSelectedJobWorkers([]);
        setJobSearchKeyword("");
        setJobSearchResults([]);
        setIsSearchingJobs(false);
        setJobSearchPage(1);
        setJobSearchTotalPages(1);
    };

    const getDisputeTypeLabel = (disputeTypeId: number) => {
        switch (disputeTypeId) {
            case DisputeType.JobQuality:
                return "Chất lượng công việc";
            case DisputeType.Payment:
                return "Thanh toán";
            case DisputeType.Other:
                return "Khác";
            default:
                return `Loại #${disputeTypeId}`;
        }
    };

    const getDisputeStatusBadgeClass = (statusId: number) => {
        switch (statusId) {
            case DisputeStatus.Pending:
                return "bg-amber-100 text-amber-700 border-amber-200";
            case DisputeStatus.UnderReview:
                return "bg-blue-100 text-blue-700 border-blue-200";
            case DisputeStatus.Resolved:
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case DisputeStatus.Rejected:
                return "bg-rose-100 text-rose-700 border-rose-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const fetchMyDisputes = async () => {
        setIsLoadingDisputes(true);
        try {
            const disputesResponse = await disputeService.getMyDisputes();
            const disputes = Array.isArray(disputesResponse.data) ? disputesResponse.data : [];
            const sortedDisputes = [...disputes].sort(
                (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
            );
            setMyDisputes(sortedDisputes);
        } catch (disputeError) {
            console.error("Failed to fetch disputes:", disputeError);
            setMyDisputes([]);
        } finally {
            setIsLoadingDisputes(false);
        }
    };

    const openDisputeDetailDialog = async (dispute: DisputeReportDTO) => {
        setIsDisputeDialogOpen(true);
        setIsLoadingDisputeDetail(true);
        setSelectedDispute(dispute);
        setSelectedDisputeComments([]);

        try {
            const [detailResponse, commentsResponse] = await Promise.all([
                disputeService.getDisputeById(dispute.id),
                disputeService.getComments(dispute.id),
            ]);

            setSelectedDispute(detailResponse.data);
            setSelectedDisputeComments(Array.isArray(commentsResponse.data) ? commentsResponse.data : []);
        } catch (error) {
            console.error("Failed to fetch dispute detail:", error);
        } finally {
            setIsLoadingDisputeDetail(false);
        }
    };

    const handleCreateDispute = async () => {
        if (!newDisputeForm.jobPostId.trim()) {
            toast.error("Vui lòng nhập mã bài đăng công việc.");
            return;
        }

        if (!newDisputeForm.reason.trim()) {
            toast.error("Vui lòng nhập lý do khiếu nại.");
            return;
        }

        setIsCreatingDispute(true);
        try {
            const payload: any = {
                jobPostId: newDisputeForm.jobPostId.trim(),
                disputeTypeId: Number(newDisputeForm.disputeTypeId),
                reason: newDisputeForm.reason.trim(),
            };

            if (newDisputeForm.workerId.trim()) {
                payload.workerId = newDisputeForm.workerId.trim();
            }
            if (newDisputeForm.description.trim()) {
                payload.description = newDisputeForm.description.trim();
            }
            if (newDisputeForm.evidenceUrl.trim()) {
                payload.evidenceUrl = newDisputeForm.evidenceUrl.trim();
            }

            await disputeService.createDispute(payload);

            toast.success("Đã tạo khiếu nại thành công.");
            setIsCreateDisputeDialogOpen(false);
            resetCreateDisputeForm();
            await fetchMyDisputes();
        } catch (error) {
            console.error("Failed to create dispute:", error);
            toast.error("Không thể tạo khiếu nại. Vui lòng thử lại.");
        } finally {
            setIsCreatingDispute(false);
        }
    };

    useEffect(() => {
        if (!isCreateDisputeDialogOpen) {
            return;
        }

        const keyword = jobSearchKeyword.trim();

        const timeout = setTimeout(async () => {
            setIsSearchingJobs(true);
            try {
                const response = await jobService.getFilteredJobsByFarmer({
                    title: keyword.length >= 2 ? keyword : undefined,
                    page: jobSearchPage,
                    limit: 10,
                    sortByDatesDescending: true,
                });

                const jobs = Array.isArray(response.data.data) ? response.data.data : [];
                const filteredJobs = jobs.filter(
                    (job) => job.statusId === JobPostStatus.InProgress || job.statusId === JobPostStatus.Completed
                );
                setJobSearchResults(filteredJobs);
                setJobSearchTotalPages(response.data.pagination?.totalPages ?? 1);
            } catch (error) {
                console.error("Failed to search farmer jobs:", error);
                setJobSearchResults([]);
                setJobSearchTotalPages(1);
            } finally {
                setIsSearchingJobs(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [jobSearchKeyword, isCreateDisputeDialogOpen, jobSearchPage]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const response = await farmerService.getProfile();
                setProfile(response.data);
                
                // Fetch default farm info
                if (response.data.mainFarmId) {
                    const farmResponse = await FarmService.getFarm(response.data.mainFarmId);
                    setDefaultFarmInfo(farmResponse.data);
                } else {
                    setDefaultFarmInfo(null);
                }

                await fetchMyDisputes();
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
                        {profile.user?.isActive === true &&
                            (<span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 mt-2">
                                Đang hoạt động
                            </span>)
                        }
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
                        <CardDescription>Vị trí đất nông nghiệp chính</CardDescription>
                        
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-1">
                            <span className="text-sm font-medium text-slate-500">Địa chỉ hiện tại</span>
                            <span className="text-base text-slate-900">{defaultFarmInfo?.address || profile.address || "—"}</span>
                        </div>

                        <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">

                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-slate-500">Tên địa điểm</span>
                                <span className="text-base text-slate-900">{defaultFarmInfo?.locationName || "—"}</span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-slate-500">Loại hình</span>
                                <span className="text-base text-slate-900">{defaultFarmInfo?.farmTypeName || "—"}</span>
                            </div>
                         
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-slate-500">Số lượng vật nuôi</span>
                                <span className="text-base text-slate-900">
                                    {defaultFarmInfo?.livestockCount != null ? defaultFarmInfo.livestockCount : "—"}
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-slate-500">Diện tích</span>
                                <span className="text-base text-slate-900">
                                    {defaultFarmInfo?.areaSize != null ? `${defaultFarmInfo.areaSize} m²` : "—"}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                    Tổng khiếu nại
                                </span>
                                <span className="text-base text-slate-900">
                                    {isLoadingDisputes ? "Đang tải..." : myDisputes.length}
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-slate-500">Đang xử lý</span>
                                <span className="text-base text-slate-900">
                                    {isLoadingDisputes
                                        ? "Đang tải..."
                                        : myDisputes.filter(
                                            (dispute) =>
                                                dispute.statusId === DisputeStatus.Pending ||
                                                dispute.statusId === DisputeStatus.UnderReview
                                        ).length}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Collapsible open={isDisputesOpen} onOpenChange={setIsDisputesOpen} className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 px-2">
                        <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold">Khiếu nại của tôi</h4>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                                resetCreateDisputeForm();
                                setIsCreateDisputeDialogOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Tạo mới
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={fetchMyDisputes}
                            disabled={isLoadingDisputes}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoadingDisputes ? "animate-spin" : ""}`} />
                        </Button>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full data-[state=open]:rotate-180 transition-transform duration-200">
                                <ChevronDown className="h-4 w-4" />
                                <span className="sr-only">Toggle disputes</span>
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </div>

                <CollapsibleContent>
                    <Card className="border-0 shadow-sm border-slate-100 bg-white/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Lịch sử khiếu nại</CardTitle>
                            <CardDescription>
                                {isLoadingDisputes ? "Đang tải dữ liệu..." : `${myDisputes.length} khiếu nại`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {isLoadingDisputes ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-16 w-full rounded-lg" />
                                    <Skeleton className="h-16 w-full rounded-lg" />
                                    <Skeleton className="h-16 w-full rounded-lg" />
                                </div>
                            ) : myDisputes.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    Bạn chưa có khiếu nại nào.
                                </div>
                            ) : (
                                myDisputes.map((dispute) => (
                                    <div key={dispute.id} className="rounded-lg border p-3 bg-background/60">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className={getDisputeStatusBadgeClass(dispute.statusId)}>
                                                        {getDisputeStatusLabel(dispute.statusId)}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {getDisputeTypeLabel(dispute.disputeTypeId)}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-medium text-slate-800">{dispute.reason}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Tạo lúc: {format(new Date(dispute.createdAt), "dd/MM/yyyy HH:mm")}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                                onClick={() => openDisputeDetailDialog(dispute)}
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                Xem chi tiết
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chi tiết khiếu nại</DialogTitle>
                        <DialogDescription>
                            Xem thông tin chi tiết và các bình luận của khiếu nại.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingDisputeDetail ? (
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-2/3" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : selectedDispute ? (
                        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                            <div className="space-y-2 rounded-lg border p-3 bg-background/60">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className={getDisputeStatusBadgeClass(selectedDispute.statusId)}>
                                        {getDisputeStatusLabel(selectedDispute.statusId)}
                                    </Badge>
                                    <Badge variant="outline">{getDisputeTypeLabel(selectedDispute.disputeTypeId)}</Badge>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{selectedDispute.reason}</p>
                                <p className="text-xs text-muted-foreground">
                                    Tạo lúc: {format(new Date(selectedDispute.createdAt), "dd/MM/yyyy HH:mm")}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Mã khiếu nại</p>
                                    <p className="text-sm font-medium break-all">{selectedDispute.id}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Mã bài đăng</p>
                                    <p className="text-sm font-medium break-all">{selectedDispute.jobPostId}</p>
                                </div>
                            </div>

                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground mb-1">Mô tả</p>
                                <p className="text-sm">{selectedDispute.description || "Không có mô tả"}</p>
                            </div>

                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground mb-1">Ghi chú quản trị</p>
                                <p className="text-sm">{selectedDispute.adminNote || "Chưa có ghi chú"}</p>
                            </div>

                            {selectedDispute.evidenceUrl && (
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground mb-2">Bằng chứng</p>
                                    <a
                                        href={selectedDispute.evidenceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-700 underline break-all"
                                    >
                                        {selectedDispute.evidenceUrl}
                                    </a>
                                </div>
                            )}

                            <div className="rounded-lg border p-3 space-y-2">
                                <p className="text-xs text-muted-foreground">Bình luận ({selectedDisputeComments.length})</p>
                                {selectedDisputeComments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Chưa có bình luận.</p>
                                ) : (
                                    selectedDisputeComments.map((comment) => (
                                        <div key={comment.id} className="rounded-md border p-2.5 bg-background/80">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-xs font-semibold text-slate-700">{comment.userName}</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}
                                                </p>
                                            </div>
                                            <p className="text-sm mt-1">{comment.content}</p>
                                            {comment.attachmentUrl && (
                                                <a
                                                    href={comment.attachmentUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-blue-600 hover:text-blue-700 underline mt-1 inline-block"
                                                >
                                                    Xem tệp đính kèm
                                                </a>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Không có dữ liệu khiếu nại.</p>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={isCreateDisputeDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateDisputeDialogOpen(open);
                    if (!open) {
                        resetCreateDisputeForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tạo khiếu nại mới</DialogTitle>
                        <DialogDescription>
                            Điền thông tin khiếu nại để gửi lên hệ thống.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-700">Tìm bài đăng công việc</p>
                            <Input
                                placeholder="Nhập tối thiểu 2 ký tự tên bài đăng"
                                value={jobSearchKeyword}
                                onChange={(event) =>
                                    {
                                        const value = event.target.value;
                                        setJobSearchKeyword(value);
                                        setJobSearchPage(1);
                                        setNewDisputeForm((prev) => ({ ...prev, jobPostId: "", jobPostTitle: "", workerId: "" }));
                                        setSelectedJobWorkers([]);
                                    }
                                }
                            />

                            {newDisputeForm.jobPostId && (
                                <p className="text-xs text-emerald-700">
                                    Đã chọn bài đăng: {newDisputeForm.jobPostTitle || newDisputeForm.jobPostId}
                                </p>
                            )}

                            {(isSearchingJobs || jobSearchResults.length > 0 || isCreateDisputeDialogOpen) && (
                                <div className="max-h-48 overflow-y-auto rounded-md border bg-background">
                                    {isSearchingJobs ? (
                                        <p className="p-3 text-sm text-muted-foreground">Đang tìm bài đăng...</p>
                                    ) : jobSearchResults.length === 0 ? (
                                        <p className="p-3 text-sm text-muted-foreground">Không tìm thấy bài đăng phù hợp.</p>
                                    ) : (
                                        jobSearchResults.map((job) => (
                                            <button
                                                type="button"
                                                key={job.id}
                                                className="w-full text-left p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                                                onClick={async () => {
                                                    setNewDisputeForm((prev) => ({ ...prev, jobPostId: job.id, jobPostTitle: job.title || "", workerId: "" }));
                                                    setJobSearchKeyword(job.title || "");
                                                    setJobSearchResults([]);
                                                    
                                                    try {
                                                        const response = await jobService.getJobDetail(job.id);
                                                        setSelectedJobWorkers(response.data.workers || []);
                                                    } catch (error) {
                                                        console.error("Failed to fetch job details:", error);
                                                        setSelectedJobWorkers([]);
                                                    }
                                                }}
                                            >
                                                <p className="text-sm font-medium text-slate-800 line-clamp-1">{job.title || "(Không có tiêu đề)"}</p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setJobSearchPage((prev) => Math.max(1, prev - 1))}
                                    disabled={jobSearchPage <= 1 || isSearchingJobs}
                                >
                                    <ChevronLeft className="mr-1 h-4 w-4" />
                                    Sau
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    Trang {jobSearchPage}/{jobSearchTotalPages}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setJobSearchPage((prev) => Math.min(jobSearchTotalPages, prev + 1))}
                                    disabled={jobSearchPage >= jobSearchTotalPages || isSearchingJobs}
                                >
                                    Trước
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {newDisputeForm.jobPostId && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                <p className="text-sm font-medium text-slate-700">Người lao động liên quan (tuỳ chọn)</p>
                                <select
                                    value={newDisputeForm.workerId}
                                    onChange={(event) =>
                                        setNewDisputeForm((prev) => ({
                                            ...prev,
                                            workerId: event.target.value,
                                        }))
                                    }
                                    disabled={selectedJobWorkers.length === 0}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                                >
                                    <option value="">-- Báo cáo chung (không chọn người lao động) --</option>
                                    {selectedJobWorkers.map((worker) => {
                                        const wId = worker.workerId || (worker as any).id || (worker as any).userId || (worker as any).workerProfileId || "";
                                        return (
                                            <option key={wId || worker.phoneNumber || Math.random()} value={wId}>
                                                {worker.fullName} - {worker.phoneNumber}
                                            </option>
                                        );
                                    })}
                                </select>
                                {selectedJobWorkers.length === 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">Bài đăng này chưa có người lao động nào.</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-700">Loại khiếu nại</p>
                            <select
                                value={newDisputeForm.disputeTypeId}
                                onChange={(event) =>
                                    setNewDisputeForm((prev) => ({
                                        ...prev,
                                        disputeTypeId: Number(event.target.value) as DisputeType,
                                    }))
                                }
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value={DisputeType.JobQuality}>Chất lượng công việc</option>
                                <option value={DisputeType.Payment}>Thanh toán</option>
                                <option value={DisputeType.Other}>Khác</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-700">Lý do khiếu nại</p>
                            <Input
                                placeholder="Ví dụ: Công việc thực tế không đúng mô tả"
                                value={newDisputeForm.reason}
                                onChange={(event) =>
                                    setNewDisputeForm((prev) => ({ ...prev, reason: event.target.value }))
                                }
                            />
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-700">Mô tả chi tiết (tuỳ chọn)</p>
                            <Textarea
                                placeholder="Mô tả thêm về tình huống tranh chấp"
                                value={newDisputeForm.description}
                                onChange={(event) =>
                                    setNewDisputeForm((prev) => ({ ...prev, description: event.target.value }))
                                }
                                rows={4}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-slate-700">Link bằng chứng (tuỳ chọn)</p>
                            <Input
                                placeholder="https://..."
                                value={newDisputeForm.evidenceUrl}
                                onChange={(event) =>
                                    setNewDisputeForm((prev) => ({ ...prev, evidenceUrl: event.target.value }))
                                }
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateDisputeDialogOpen(false)}
                                disabled={isCreatingDispute}
                            >
                                Huỷ
                            </Button>
                            <Button
                                onClick={handleCreateDispute}
                                disabled={isCreatingDispute}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isCreatingDispute ? "Đang gửi..." : "Gửi khiếu nại"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
