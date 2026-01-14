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

### Cho Người lao động (Worker)

- **Tìm kiếm thông minh** - Tìm việc theo GPS, lọc theo khoảng cách, lương, loại công việc
- **Ứng tuyển nhanh** - Ứng tuyển chỉ trong vài phút
- **Ví điện tử** - Nhận lương qua VNPay/Momo an toàn
- **Hệ thống đánh giá** - Xây dựng reputation qua rating
- **Chat trực tiếp** - Liên hệ nông dân để làm rõ công việc

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

## Cấu trúc dự án

```
CAPSTONE_SP25_FE/
│
├── app/                        # Next.js App Router
│   ├── page.tsx               # Landing page (/)
│   ├── layout.tsx             # Root layout + metadata
│   ├── globals.css            # Global styles
│   │
│   ├── admin/                 # Admin portal routes
│   │   ├── page.tsx          # /admin - Dashboard
│   │   ├── users/            # User management
│   │   ├── disputes/         # Dispute resolution
│   │   └── settings/         # Admin settings
│   │
│   ├── farmer/                # Farmer dashboard routes
│   │   ├── page.tsx          # /farmer - Dashboard
│   │   ├── jobs/             # Job postings
│   │   │   └── new/          # Create new job
│   │   ├── applicants/       # Review applicants
│   │   └── payments/         # Payment management
│   │
│   └── worker/                # Worker mobile app routes
│       ├── page.tsx          # /worker - Home
│       ├── search/           # Job search
│       ├── jobs/             # My jobs
│       ├── wallet/           # Wallet
│       └── profile/          # Profile & ratings
│
├── components/                # React components
│   ├── ui/                   # 45+ shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── landing/              # Landing page sections
│   │   ├── landing-hero.tsx
│   │   ├── landing-features.tsx
│   │   └── ...
│   │
│   ├── farmer/               # Farmer-specific components
│   │   ├── farmer-layout.tsx
│   │   ├── farmer-dashboard.tsx
│   │   └── ...
│   │
│   ├── worker/               # Worker-specific components
│   │   ├── worker-mobile-layout.tsx
│   │   ├── worker-home-screen.tsx
│   │   └── ...
│   │
│   └── admin/                # Admin-specific components
│       ├── admin-layout.tsx
│       ├── admin-dashboard.tsx
│       └── ...
│
├── lib/                       # Utilities
│   └── utils.ts              # cn() helper, etc.
│
├── hooks/                     # Custom React hooks
│   ├── use-toast.ts
│   └── use-mobile.ts
│
├── public/                    # Static assets
│   └── images/
│
├── styles/                    # Additional styles
│   └── globals.css
│
├── .gitmessage               # Git commit template
├── CONTRIBUTING.md           # Contributing guidelines
├── components.json           # shadcn/ui config
├── next.config.mjs           # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── package.json              # Dependencies & scripts
└── pnpm-lock.yaml           # Lock file
```

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
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id

# Payment Gateways (sẽ cập nhật)
NEXT_PUBLIC_VNPAY_URL=
NEXT_PUBLIC_MOMO_URL=
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

- **Components**: PascalCase (`WorkerDashboard.tsx`)
- **Utilities**: kebab-case (`format-currency.ts`)
- **Hooks**: use-\* prefix (`use-auth.ts`)
- **Server Components**: Default (no "use client")
- **Client Components**: Add `"use client"` directive

### Styling Guidelines

```tsx
// ✅ Good: Use cn() helper for conditional classes
import { cn } from '@/lib/utils'

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

### Worker Portal (/worker)

**Mobile-First Design**

- Home: Job discovery feed với nearby jobs
- Search: Advanced job search & filters
- Jobs: Quản lý jobs đã ứng tuyển/đang làm
- Wallet: Xem số dư, lịch sử giao dịch
- Profile: Thông tin cá nhân, rating, history

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

## Roadmap

### Phase 1: UI/UX Foundation ✅ (Current)

- [x] Landing page
- [x] Worker mobile interface
- [x] Farmer dashboard
- [x] Admin portal
- [x] Component library (shadcn/ui)
- [x] Routing structure

### Phase 2: Backend Integration 🚧 (In Progress)

- [ ] REST API integration
- [ ] Authentication (JWT)
- [ ] User management
- [ ] Job CRUD operations
- [ ] Real-time notifications
- [ ] File upload (avatars, docs)

### Phase 3: Core Features 📝 (Planned)

- [ ] GPS-based job search
- [ ] Payment gateway integration (VNPay/Momo)
- [ ] Chat/messaging system
- [ ] Rating & review system
- [ ] Dispute management
- [ ] Email notifications

### Phase 4: Advanced Features 🎯 (Future)

- [ ] AI job matching
- [ ] Analytics dashboard
- [ ] Mobile apps (React Native)
- [ ] Multi-language support
- [ ] Advanced filtering & search
- [ ] Export reports (PDF/Excel)

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

## 👨‍💻 Team

**CAPSTONE_SP25** - FPT University

- **Frontend Lead**: [Your Name]
- **Backend Team**: [Names]
- **UI/UX Designer**: [Name]
- **Project Manager**: [Name]

---

## 📞 Contact

- **Repository**: [https://github.com/tylum123/CAPSTONE_SP25_FE](https://github.com/tylum123/CAPSTONE_SP25_FE)
- **Issues**: [GitHub Issues](https://github.com/tylum123/CAPSTONE_SP25_FE/issues)
- **Email**: your.email@example.com

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [shadcn/ui](https://ui.shadcn.com/) - UI Component System
- [Radix UI](https://www.radix-ui.com/) - Headless UI Components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vercel](https://vercel.com/) - Deployment Platform

---

<div align="center">
  
**Built with ❤️ by CAPSTONE_SP25 Team**

[⬆ Back to top](#-agrotem---nền-tảng-tuyển-dụng-nông-nghiệp-thời-vụ)

</div>
