"use client";

import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminService, jobCategoryService } from "@/libs/api/services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { JobCategory } from "@/libs/types";

interface Skill {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
}

interface SkillFormData {
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
}

export function AdminSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, categoriesRes] = await Promise.all([
        adminService.getSkills(),
        jobCategoryService.getJobCategories(),
      ]);

      const skillsPayload = skillsRes.data as Skill[];
      if (skillsPayload && typeof skillsPayload === "object") {
        setSkills(skillsPayload || []);
      }

      const categoriesPayload = categoriesRes.data as JobCategory[];
      if (Array.isArray(categoriesPayload)) {
        setCategories(categoriesPayload);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const filteredSkills = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return skills.filter((skill) => {
      const matchName =
        keyword.length === 0 || skill.name.toLowerCase().includes(keyword);
      const matchCategory =
        categoryFilter === "" || skill.categoryId === categoryFilter;
      return matchName && matchCategory;
    });
  }, [skills, searchTerm, categoryFilter]);

  const categoryNameById = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState<SkillFormData>({
    name: "",
    description: "",
    categoryId: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const openAddDialog = () => {
    setEditingSkill(null);
    setFormData({
      name: "",
      description: "",
      categoryId: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      description: skill.description,
      categoryId: skill.categoryId,
      isActive: skill.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSaveSkill = async () => {
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên kỹ năng");
      return;
    }

    setSubmitting(true);
    try {
      if (editingSkill) {
        // Update skill
        await adminService.updateSkill(editingSkill.id, formData);
        setSkills((prev) =>
          prev.map((s) =>
            s.id === editingSkill.id ? { ...s, ...formData } : s,
          ),
        );
        alert("Cập nhật kỹ năng thành công");
      } else {
        // Create skill
        const newSkill = await adminService.createSkill(formData);
        setSkills((prev) => [newSkill.data, ...prev]);
        alert("Tạo kỹ năng thành công");
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Lỗi khi lưu kỹ năng");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skill: Skill) => {
    if (
      !confirm(`Xóa kỹ năng "${skill.name}"? Hành động này không thể hoàn tác.`)
    )
      return;

    setActionLoading(skill.id);
    try {
      await adminService.deleteSkill(skill.id);
      setSkills((prev) => prev.filter((s) => s.id !== skill.id));
      alert("Xóa kỹ năng thành công");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Lỗi khi xóa kỹ năng");
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = skills.filter((s) => s.isActive).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Quản lý kỹ năng
          </h1>
          <p className="text-muted-foreground mt-2">
            Quản lý các kỹ năng công việc trong hệ thống
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus size={20} />
          Thêm kỹ năng
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? "Cập nhật kỹ năng" : "Thêm kỹ năng mới"}
            </DialogTitle>
            <DialogDescription>
              {editingSkill
                ? "Chỉnh sửa thông tin kỹ năng"
                : "Nhập thông tin kỹ năng mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tên kỹ năng
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ví dụ: Canh tác lúa"
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả chi tiết về kỹ năng"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Danh mục
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground"
              >
                <option value="">Chọn danh mục</option>
                {categories
                  .filter((category) => category.isActive)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-foreground"
              >
                Kích hoạt kỹ năng
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleSaveSkill} disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search
            size={20}
            className="absolute left-3 top-2.5 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên kỹ năng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option value="">Tất cả danh mục</option>
          {categories
            .filter((category) => category.isActive)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      </div>

      {/* Skills Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Tên kỹ năng
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <Loader2 size={28} className="inline animate-spin mr-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : filteredSkills.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center text-muted-foreground"
                  >
                    Không tìm thấy kỹ năng nào.
                  </td>
                </tr>
              ) : (
                filteredSkills.map((skill) => (
                  <tr
                    key={skill.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">
                        {skill.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p
                        className="text-muted-foreground truncate"
                        title={skill.description}
                      >
                        {skill.description || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-muted-foreground text-sm">
                        {categoryNameById[skill.categoryId] || skill.categoryId}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          skill.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {skill.isActive ? "Hoạt động" : "Vô hiệu"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditDialog(skill)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} className="text-blue-500" />
                        </button>
                        <button
                          disabled={actionLoading === skill.id}
                          onClick={() => handleDeleteSkill(skill)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                          title="Xóa"
                        >
                          {actionLoading === skill.id ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-muted-foreground"
                            />
                          ) : (
                            <Trash2 size={18} className="text-destructive" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Hiển thị {filteredSkills.length} / {skills.length} kỹ năng (
        {activeCount} hoạt động)
      </div>
    </div>
  );
}
