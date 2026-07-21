export const config = {
  // Quitamos '/' y '/login' del matcher para que el servidor no interfiera en la pantalla inicial
  matcher: ['/dashboard/:path*', '/admin/:path*', '/portal/:path*'],
}
