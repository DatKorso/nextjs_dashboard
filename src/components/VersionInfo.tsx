interface VersionInfoProps {
  className?: string
}

export default function VersionInfo({ className }: VersionInfoProps) {
  const version = process.env.npm_package_version || '0.1.0'
  
  return (
    <div className={`p-3 bg-white rounded-lg border ${className}`}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Версия системы
      </div>
      
      <div className="text-sm font-medium text-gray-900">
        v{version}
      </div>
      
      <div className="text-xs text-gray-400 mt-1">
        Data Dashboard
      </div>
    </div>
  )
}