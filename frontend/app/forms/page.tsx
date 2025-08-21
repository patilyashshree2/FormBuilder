"use client";
import { useEffect, useState } from "react";
import { getAllForms } from "../api-client";
import AuthGuard from "../../components/AuthGuard";

export default function MyForms() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    try {
      const data = await getAllForms();
      setForms(data);
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">My Forms</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all your created forms</p>
        </div>

        {/* Forms Grid */}
        {forms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <div key={form.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">{form.title}</h3>
                
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    form.status === 'published' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {form.status === 'published' ? '🟢 Published' : '🟡 Draft'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {form.fields?.length || 0} fields
                  </span>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <p>Created: {new Date(form.createdAt).toLocaleDateString()}</p>
                  <p>Updated: {new Date(form.updatedAt).toLocaleDateString()}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {form.status === 'draft' && (
                    <a 
                      href={`/forms/${form.id}/edit`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Edit
                    </a>
                  )}
                  {form.status === 'published' && (
                    <>
                      <a 
                        href={`/forms/${form.id}/share`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                      >
                        Share
                      </a>
                      <a 
                        href={`/forms/${form.id}/analytics`}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                      >
                        Analytics
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <span className="text-6xl mb-4 block">📝</span>
            <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">No Forms Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't created any forms yet. Start building your first form!
            </p>
            <a 
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Your First Form
            </a>
          </div>
        )}
        </div>
      </div>
    </AuthGuard>
  );
}
