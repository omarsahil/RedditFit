export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-gray-600">If you can see this, routing is working!</p>
        <a href="/dashboard" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}