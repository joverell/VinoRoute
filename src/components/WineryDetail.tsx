import { Winery } from "@/types";

interface WineryDetailProps {
  winery: Winery;
  onClearSelection: () => void;
}

export default function WineryDetail({ winery, onClearSelection }: WineryDetailProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <button
        onClick={onClearSelection}
        className="text-sm text-teal-500 hover:underline mb-4"
      >
        &larr; Back to list
      </button>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{winery.name}</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {winery.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 text-xs text-white bg-teal-500 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-2 text-sm text-gray-600">
          {winery.address && <p className="flex items-start"><span className="w-20 font-bold shrink-0">Address</span><span className="text-gray-800">{winery.address}</span></p>}
          {winery.state && <p className="flex items-center"><span className="w-20 font-bold shrink-0">State</span><span className="text-gray-800">{winery.state}</span></p>}
          <p className="flex items-center"><span className="w-20 font-bold shrink-0">Region</span><span className="text-gray-800">{winery.region}</span></p>
          <p className="flex items-center"><span className="w-20 font-bold shrink-0">Type</span><span className="capitalize text-gray-800">{winery.type}</span></p>
          {winery.url && (
            <p className="flex items-start">
              <span className="w-20 font-bold shrink-0">Website</span>
              <a
                href={winery.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-500 hover:underline break-all"
              >
                {winery.url}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
