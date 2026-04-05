# AgroTemp - Nền tảng Tuyển dụng Nông nghiệp Thời vụ

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=flat&logo=tailwind-css)

**AgroTemp** là nền tảng kết nối nông dân với người lao động thời vụ tại Việt Nam. Giải pháp số hóa quy trình tuyển dụng trong lĩnh vực nông nghiệp với công nghệ hiện đại.

---

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Tech Stack](#tech-stack)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cài đặt](#cài-đặt)
- [Development](#development)
- [User Roles](#user-roles)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## Tính năng chính

### Cho Nông dân (Farmer)

- **Đăng tin tuyển dụng** - Tạo và quản lý tin tuyển dụng dễ dàng
- **Quản lý ứng viên** - Duyệt/từ chối ứng viên, xem profile & rating
- **Quản lý thanh toán** - Theo dõi chi phí, thanh toán qua nền tảng
- **Thống kê chi tiết** - Dashboard với metrics về tuyển dụng
- **Thông báo real-time** - Nhận thông báo khi có ứng viên mới

### Cho Quản trị viên (Admin)

- **Dashboard tổng quan** - Thống kê users, jobs, transactions
- **Quản lý người dùng** - Quản lý farmers & workers
- **Giải quyết tranh chấp** - Hệ thống xử lý khiếu nại
- **Quản lý tài chính** - Theo dõi doanh thu, commission
- **Xác minh tài khoản** - Verify users để tăng độ tin cậy

---

## Tech Stack

### Frontend Framework

- **Next.js 16.0** - App Router, React Server Components, Streaming SSR
- **React 19.2** - Latest features, improved performance
- **TypeScript 5.x** - Type safety, better developer experience

### UI & Styling

- **Tailwind CSS 4.1** - Utility-first CSS framework
- **Radix UI** - Headless, accessible component primitives (20+ packages)
- **shadcn/ui** - Re-usable component system
- **Lucide React** - Beautiful icon library (1000+ icons)
- **class-variance-authority** - CVA pattern for component variants

### Form & Validation

- **React Hook Form 7.60** - Performant form management
- **Zod 3.25** - TypeScript-first schema validation

### Data Visualization

- **Recharts 2.15** - Declarative charts for admin dashboard

### Additional Libraries

- **next-themes** - Dark/Light mode support
- **sonner** - Toast notifications
- **date-fns** - Date manipulation
- **Vercel Analytics** - Web analytics

### Development Tools

- **pnpm** - Fast, disk-efficient package manager
- **ESLint** - Code linting
- **PostCSS** - CSS processing

---

## Cài đặt

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 9.x

**Cài đặt pnpm:**

```bash
# Windows (PowerShell)
npm install -g pnpm

# macOS/Linux
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Clone Repository

```bash
git clone https://github.com/tylum123/CAPSTONE_SP25_FE.git
cd CAPSTONE_SP25_FE
```

### Install Dependencies

```bash
# Sử dụng pnpm
pnpm install
```

**⚠️ Lưu ý:** Dự án sử dụng pnpm làm package manager chính. Vui lòng không dùng npm/yarn để tránh conflict lockfiles.

### Environment Variables

Tạo file `.env.local`:

```env
# API Configuration (sẽ cập nhật khi có backend)
NEXT_PUBLIC_API_URL=http://localhost:5057
NEXT_PUBLIC_APP_URL=http://localhost:3000

```

### Run Development Server

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

---

## Development

### Available Scripts

```bash
# Development server (Turbopack enabled)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### First Time Setup

```bash
# 1. Install pnpm globally
npm install -g pnpm

# 2. Install dependencies
pnpm install

# 3. Run development server
pnpm dev

# 4. Open browser at http://localhost:3000
```

### Adding New Components

Sử dụng shadcn/ui CLI:

```bash
# Add new UI component
npx shadcn@latest add [component-name]

# Example: Add sheet component
npx shadcn@latest add sheet
```

### Project Conventions

- **Components**: PascalCase (`farmerDashboard.tsx`)
- **Utilities**: kebab-case (`format-currency.ts`)
- **Hooks**: use-\* prefix (`use-auth.ts`)
- **Server Components**: Default (no "use client")
- **Client Components**: Add `"use client"` directive

### Styling Guidelines

```tsx
// ✅ Good: Use cn() helper for conditional classes
import { cn } from '@/libs/utils'

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />

// ✅ Good: Use Tailwind utilities
<button className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90">

// ❌ Bad: Inline styles
<button style={{ backgroundColor: 'blue' }}>
```

---

## User Roles

### Landing Page (/)

- Hero section với CTA
- Feature showcase (Worker/Farmer)
- Platform statistics
- How it works
- Footer với links

### Farmer Portal (/farmer)

**Desktop-Optimized Dashboard**

- Dashboard: Overview với metrics cards
- Jobs: Quản lý tin tuyển dụng
  - Danh sách jobs
  - Tạo job mới
  - Edit/delete jobs
- Applicants: Review và quản lý ứng viên
- Payments: Lịch sử thanh toán, chi phí

### Admin Portal (/admin)

**Full System Management**

- Dashboard: System-wide metrics & charts
- Users: Quản lý farmers & workers
- Jobs: Monitor tất cả job postings
- Disputes: Giải quyết khiếu nại
- Finance: Revenue, commission tracking
- Verification: Xác minh user accounts
- Settings: System configuration

---

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết chi tiết về:

- Git commit conventions
- Branching strategy
- Pull request process
- Code style guidelines

### Quick Start Contributing

```bash
# Setup git commit template
git config --local commit.template .gitmessage

# Create feature branch
git checkout -b feat/your-feature

# Make changes and commit
git add .
git commit
# Editor mở với template

# Push và tạo PR
git push origin feat/your-feature
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  
**Built with ❤️ by CAPSTONE_SP25 Team**

[⬆ Back to top](#-agrotem---nền-tảng-tuyển-dụng-nông-nghiệp-thời-vụ)

</div>
