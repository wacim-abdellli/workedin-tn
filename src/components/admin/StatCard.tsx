interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    trend?: number;
}

export default function StatCard({ icon: Icon, label, value, color, trend }: StatCardProps) {
    return (
        <div className="card p-6 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {trend !== undefined && (
                    <span className={`text-sm flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend}%
                    </span>
                )}
            </div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted mt-1">{label}</p>
        </div>
    );
}
