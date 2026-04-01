const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/OverviewTab.tsx', 'utf8');

if(!code.includes('Loader2')) {
    code = code.replace(/import \{.*?\} from 'lucide-react';/s, (match) => {
        return match.replace('lucide-react', 'Loader2, lucide-react');
    });
	// better replacement:
    code = code.replace('from \'lucide-react\';', ', Loader2 } from \'lucide-react\';').replace('} , Loader2', ', Loader2');
}

code = code.replace('const { data: stats } = useQuery', 'const { data: stats, isLoading } = useQuery');

const renderBlock = `    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">`;

const replaceRender = `    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">`;

code = code.replace(renderBlock, replaceRender);
fs.writeFileSync('src/pages/admin/OverviewTab.tsx', code);
