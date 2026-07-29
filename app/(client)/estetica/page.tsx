14:22:34.931 Running build in Washington, D.C., USA (East) – iad1
14:22:34.931 Build machine configuration: 2 cores, 8 GB
14:22:35.131 Cloning github.com/olivertborges/salon-belleza-premium (Branch: main, Commit: 2b06c8e)
14:22:36.059 Cloning completed: 928.000ms
14:22:37.791 Restored build cache from previous deployment (8xBAgUA5PozpwcVabd1aUZqEra9w)
14:22:38.101 Running "vercel build"
14:22:38.168 Vercel CLI 58.1.0
14:22:38.196 Detected OpenTelemetry dependency: @opentelemetry/api@1.9.1, which meets the minimum version requirement of 1.7.0
14:22:38.516 Installing dependencies...
14:22:40.168 
14:22:40.169 up to date in 1s
14:22:40.169 
14:22:40.170 219 packages are looking for funding
14:22:40.171   run `npm fund` for details
14:22:40.212 Detected Next.js version: 14.1.0
14:22:40.220 Running "npm run build"
14:22:40.366 
14:22:40.367 > salon-belleza-premium@1.0.0 build
14:22:40.367 > next build
14:22:40.368 
14:22:41.341    ▲ Next.js 14.1.0
14:22:41.344 
14:22:41.377    Creating an optimized production build ...
14:22:50.812 Failed to compile.
14:22:50.812 
14:22:50.813 ./app/(client)/estetica/page.tsx
14:22:50.817 Error: 
14:22:50.818   x Unexpected token `div`. Expected jsx identifier
14:22:50.818      ,-[/vercel/path0/app/(client)/estetica/page.tsx:516:1]
14:22:50.819  516 |   }
14:22:50.819  517 | 
14:22:50.820  518 |   return (
14:22:50.821  519 |     <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-x-hidden ${
14:22:50.821      :      ^^^
14:22:50.822  520 |       isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
14:22:50.822  521 |     }`}>
14:22:50.823  522 |       <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />
14:22:50.824      `----
14:22:50.824 
14:22:50.825 Caused by:
14:22:50.826     Syntax Error
14:22:50.826 
14:22:50.826 Import trace for requested module:
14:22:50.826 ./app/(client)/estetica/page.tsx
14:22:50.826 
14:22:50.826 
14:22:50.829 > Build failed because of webpack errors
14:22:50.922 Error: Command "npm run build" exited with 1