export default function AboutSection({ bio }: { bio: string }) {
    return (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">نبذة عني</h2>
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {bio}
            </div>
        </section>
    );
}
