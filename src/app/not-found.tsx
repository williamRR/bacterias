export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-8">Página no encontrada</p>
        <a
          href="/"
          className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
