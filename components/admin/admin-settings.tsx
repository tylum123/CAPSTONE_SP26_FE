'use client'

import { Settings, Save, RotateCcw } from 'lucide-react'
import { useState } from 'react'

export function AdminSettings() {
  const [config, setConfig] = useState({
    commission: 5,
    serviceFee: 2,
    minDeposit: 10,
    maxWithdrawal: 5000,
    language: 'vi',
    currency: 'USD',
    notificationEmail: 'admin@agrotemp.com',
    maintenanceMode: false,
  })

  const [saveStatus, setSaveStatus] = useState('')

  const handleChange = (field: string, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setSaveStatus('saving')
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 2000)
    }, 500)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cau hinh he thong</h1>
        <p className="text-muted-foreground mt-2">Dieu chinh cac tham so va cai dat cua he thong</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/20 p-3 rounded-lg">
            <Settings size={24} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Phi va hoa hong</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Hoa hong Farmer (%)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="20"
                value={config.commission}
                onChange={(e) => handleChange('commission', parseInt(e.target.value))}
                className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-2xl font-bold text-primary min-w-12 text-right">{config.commission}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Phi hoa hong cho tung giao dich tu Farmer</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Phi dich vu (%)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="10"
                value={config.serviceFee}
                onChange={(e) => handleChange('serviceFee', parseInt(e.target.value))}
                className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-2xl font-bold text-[#D28228] min-w-12 text-right">{config.serviceFee}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Phi dich vu he thong chung</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">So tien nap toi thieu ($)</label>
            <input
              type="number"
              value={config.minDeposit}
              onChange={(e) => handleChange('minDeposit', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-2">So tien nap toi thieu cho moi giao dich</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">So tien rut toi da ($)</label>
            <input
              type="number"
              value={config.maxWithdrawal}
              onChange={(e) => handleChange('maxWithdrawal', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-2">So tien rut toi da cho moi giao dich</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-6">Cai dat chung</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Ngon ngu</label>
            <select
              value={config.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground"
            >
              <option value="vi">Tieng Viet</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Tien te</label>
            <select
              value={config.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground"
            >
              <option value="USD">USD ($)</option>
              <option value="VND">VND</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-foreground mb-2">Email thong bao quan tri</label>
            <input
              type="email"
              value={config.notificationEmail}
              onChange={(e) => handleChange('notificationEmail', e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-6">Che do bao tri</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Bat che do bao tri</p>
            <p className="text-sm text-muted-foreground mt-1">Vo hieu hoa truy cap nguoi dung trong khi bao tri he thong</p>
          </div>
          <button
            onClick={() => handleChange('maintenanceMode', !config.maintenanceMode)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              config.maintenanceMode ? 'bg-destructive' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                config.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {config.maintenanceMode && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-semibold">Che do bao tri dang BAT</p>
            <p className="text-xs text-destructive mt-1">Nguoi dung khong the truy cap he thong.</p>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-6">Thong tin he thong</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="text-foreground font-medium">Phien ban</span>
            <span className="text-muted-foreground">v1.0.0</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="text-foreground font-medium">Co so du lieu</span>
            <span className="text-muted-foreground">PostgreSQL 15.2</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="text-foreground font-medium">May chu</span>
            <span className="text-muted-foreground">AWS EC2</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground font-medium">Thoi gian cap nhat lan cuoi</span>
            <span className="text-muted-foreground">2024-03-15 10:30:00</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <button className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg text-foreground font-semibold hover:bg-muted transition-colors">
          <RotateCcw size={20} />
          Khoi phuc mac dinh
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          <Save size={20} />
          {saveStatus === 'saving' ? 'Dang luu...' : saveStatus === 'saved' ? 'Da luu' : 'Luu thay doi'}
        </button>
      </div>
    </div>
  )
}
