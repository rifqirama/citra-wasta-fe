const ForbiddenPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 transition-colors">
      <h1 className="text-3xl font-bold text-red-600 dark:text-red-500">403 - Forbidden</h1>
      <p className="text-gray-600 dark:text-gray-300 mt-2">Anda tidak punya akses ke halaman ini.</p>
    </div>
  );
};

export default ForbiddenPage;
