const DataTable = ({ columns, data, loading, emptyMessage = 'No records found' }) => (
  <div className="bg-bg-card border border-border rounded-card overflow-hidden shadow-card">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-bg-raised border-b border-border">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left text-muted text-xs font-bold uppercase tracking-wider">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 6 }).map((_, row) => (
              <tr key={row} className="border-b border-border">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    <div className="animate-pulse bg-bg-raised rounded h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          )}
          {!loading &&
            data.map((item, index) => (
              <tr key={item.id || item._id || index} className="border-b border-border hover:bg-white/[0.02] transition-colors duration-150">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-white">
                    {column.render ? column.render(item, index) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default DataTable;
