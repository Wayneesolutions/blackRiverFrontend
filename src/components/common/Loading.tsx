
function Loading() {
  return (
    <div className="flex justify-center items-center h-screen flex-col">
      <div className="text-lg font-semibold mb-2 animate-pulse">Loading...</div>
      <div className="w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
    </div>
  )
}

export default Loading