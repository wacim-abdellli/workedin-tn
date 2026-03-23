import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Send,
    Paperclip,
    MoreVertical,
    Phone,
    Video,
    Star,
    Archive,
    Trash2,
    Check,
    CheckCheck,
    ChevronLeft,
    Plus,
    FileText,
    Download,
    User,
    Briefcase,
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import EmptyState from '../components/common/EmptyState';

// Mock conversations
const MOCK_CONVERSATIONS = [
    {
        id: 'c1',
        participant: {
            id: 'u1',
            name: 'أحمد بن علي',
            title: 'مصمم جرافيكي',
            avatar: null,
            is_online: true,
        },
        last_message: 'شكراً لك، سأرسل التصميم النهائي غداً',
        last_message_time: 'منذ 5 دقائق',
        unread_count: 2,
        is_starred: true,
        job_title: 'تصميم لوجو',
    },
    {
        id: 'c2',
        participant: {
            id: 'u2',
            name: 'سارة المنصوري',
            title: 'مترجمة محترفة',
            avatar: null,
            is_online: false,
        },
        last_message: 'تم إرسال الملف المترجم',
        last_message_time: 'منذ ساعة',
        unread_count: 0,
        is_starred: false,
        job_title: 'ترجمة وثائق',
    },
    {
        id: 'c3',
        participant: {
            id: 'u3',
            name: 'محمد الشريف',
            title: 'مطور ويب',
            avatar: null,
            is_online: true,
        },
        last_message: 'هل يمكنك مراجعة الكود؟',
        last_message_time: 'منذ 3 ساعات',
        unread_count: 0,
        is_starred: false,
        job_title: 'تطوير موقع',
    },
];

// Mock messages for selected conversation
const MOCK_MESSAGES = [
    {
        id: 'm1',
        sender_id: 'u1',
        content: 'مرحباً، أنا مهتم بمشروعك',
        created_at: '10:30 ص',
        is_read: true,
    },
    {
        id: 'm2',
        sender_id: 'me',
        content: 'أهلاً! شكراً لتواصلك. هل يمكنك إرسال أمثلة من أعمالك السابقة؟',
        created_at: '10:32 ص',
        is_read: true,
    },
    {
        id: 'm3',
        sender_id: 'u1',
        content: 'بالتأكيد، هذه بعض الأعمال السابقة',
        created_at: '10:45 ص',
        is_read: true,
        attachments: [
            { name: 'portfolio.pdf', type: 'pdf', size: '2.3 MB' },
        ],
    },
    {
        id: 'm4',
        sender_id: 'me',
        content: 'ممتاز! أعجبتني أعمالك. متى يمكنك البدء؟',
        created_at: '11:00 ص',
        is_read: true,
    },
    {
        id: 'm5',
        sender_id: 'u1',
        content: 'يمكنني البدء فوراً. سأبدأ العمل على التصميم الأولي اليوم',
        created_at: '11:15 ص',
        is_read: true,
    },
    {
        id: 'm6',
        sender_id: 'u1',
        content: 'شكراً لك، سأرسل التصميم النهائي غداً',
        created_at: '2:30 م',
        is_read: false,
    },
];

export default function Messages() {
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [conversations] = useState(MOCK_CONVERSATIONS);
    const [selectedConversation, setSelectedConversation] = useState<typeof MOCK_CONVERSATIONS[0] | null>(null);
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
    const [showMobileThread, setShowMobileThread] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const message = {
            id: `m${messages.length + 1}`,
            sender_id: 'me',
            content: newMessage,
            created_at: 'الآن',
            is_read: false,
        };

        setMessages([...messages, message]);
        setNewMessage('');
    };

    const filteredConversations = conversations.filter(c => {
        if (filter === 'unread' && c.unread_count === 0) return false;
        if (filter === 'starred' && !c.is_starred) return false;
        if (searchQuery && !c.participant.name.includes(searchQuery)) return false;
        return true;
    });

    const ConversationList = () => (
        <div className="h-full flex flex-col border-l border-gray-200 dark:border-dark-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">الرسائل</h2>
                    <Button variant="primary" size="sm">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="بحث في المحادثات..."
                        className="w-full pr-10 pl-4 py-2 border border-gray-200 dark:border-dark-700 rounded-xl text-sm bg-white dark:bg-dark-800 text-foreground"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-dark-700">
                {(['all', 'unread', 'starred'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${filter === f
                            ? 'text-primary-600 border-b-2 border-primary-600'
                            : 'text-muted hover:text-foreground'
                            }`}
                    >
                        {f === 'all' ? 'الكل' : f === 'unread' ? 'غير مقروءة' : 'المميزة'}
                    </button>
                ))}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map(conversation => (
                    <div
                        key={conversation.id}
                        onClick={() => {
                            setSelectedConversation(conversation);
                            setShowMobileThread(true);
                        }}
                        className={`p-4 border-b border-gray-100 dark:border-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors ${selectedConversation?.id === conversation.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold">
                                    {conversation.participant.name.charAt(0)}
                                </div>
                                {conversation.participant.is_online && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`font-medium truncate ${conversation.unread_count > 0 ? 'text-foreground font-bold' : 'text-gray-700'}`}>
                                        {conversation.participant.name}
                                    </h3>
                                    <span className="text-xs text-muted">{conversation.last_message_time}</span>
                                </div>
                                <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-foreground' : 'text-muted'}`}>
                                    {conversation.last_message}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-primary-600">{conversation.job_title}</span>
                                    {conversation.unread_count > 0 && (
                                        <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                                            {conversation.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const MessageThread = () => (
        <div className="h-full flex flex-col">
            {selectedConversation ? (
                <>
                    {/* Thread Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowMobileThread(false)}
                                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold">
                                {selectedConversation.participant.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">{selectedConversation.participant.name}</h3>
                                <p className="text-xs text-muted">
                                    {selectedConversation.participant.is_online ? 'متصل الآن' : 'غير متصل'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-muted">
                                <Phone className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-muted">
                                <Video className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-muted">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-950">
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender_id === 'me' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`max-w-[70%] ${message.sender_id === 'me'
                                    ? 'bg-primary-600 text-white rounded-2xl rounded-tl-md'
                                    : 'bg-white dark:bg-dark-800 text-foreground rounded-2xl rounded-tr-md shadow-sm'
                                    } px-4 py-3`}>
                                    <p className="text-sm">{message.content}</p>
                                    {message.attachments && (
                                        <div className="mt-2 space-y-2">
                                            {message.attachments.map((att, i) => (
                                                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${message.sender_id === 'me' ? 'bg-primary-700' : 'bg-gray-100 dark:bg-dark-700'
                                                    }`}>
                                                    <FileText className="w-4 h-4" />
                                                    <span className="text-sm flex-1">{att.name}</span>
                                                    <span className="text-xs opacity-70">{att.size}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className={`flex items-center justify-end gap-1 mt-1 ${message.sender_id === 'me' ? 'text-primary-100' : 'text-muted'
                                        }`}>
                                        <span className="text-xs">{message.created_at}</span>
                                        {message.sender_id === 'me' && (
                                            message.is_read
                                                ? <CheckCheck className="w-3 h-3" />
                                                : <Check className="w-3 h-3" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900">
                        <div className="flex items-center gap-3">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-muted">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="اكتب رسالتك..."
                                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-foreground focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                            />
                            <Button
                                variant="primary"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-dark-900 border-l border-gray-200 dark:border-dark-700">
                    <EmptyState
                        icon={Send}
                        title="اختر محادثة"
                        description="اختر محادثة من القائمة للبدء في المراسلة"
                        illustration={
                            <div className="w-32 h-32 bg-primary-50 dark:bg-primary-900/10 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                                <Send className="w-12 h-12 text-primary-500" />
                            </div>
                        }
                    />
                </div>
            )}
        </div>
    );

    const ContactDetails = () => (
        <div className="h-full border-r border-gray-200 dark:border-dark-700 p-6 overflow-y-auto">
            {selectedConversation ? (
                <div className="space-y-6">
                    {/* Profile */}
                    <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                            {selectedConversation.participant.name.charAt(0)}
                        </div>
                        <h3 className="font-bold text-lg text-foreground">{selectedConversation.participant.name}</h3>
                        <p className="text-muted">{selectedConversation.participant.title}</p>
                        <div className="flex items-center justify-center gap-1 mt-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">4.9</span>
                            <span className="text-sm text-muted">(24 تقييم)</span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/freelancer/${selectedConversation.participant.id}`)}>
                            <User className="w-4 h-4 ml-1" />
                            البروفايل
                        </Button>
                        <Button variant="outline" size="sm">
                            <Briefcase className="w-4 h-4 ml-1" />
                            العقود
                        </Button>
                    </div>

                    {/* Related Job */}
                    <div>
                        <h4 className="font-medium text-foreground mb-3">المشروع المرتبط</h4>
                        <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                            <p className="font-medium text-foreground">{selectedConversation.job_title}</p>
                            <p className="text-sm text-muted mt-1">قيد التنفيذ</p>
                        </div>
                    </div>

                    {/* Shared Files */}
                    <div>
                        <h4 className="font-medium text-foreground mb-3">الملفات المشتركة</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                                <FileText className="w-8 h-8 text-red-500" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">portfolio.pdf</p>
                                    <p className="text-xs text-muted">2.3 MB</p>
                                </div>
                                <button className="p-2 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-lg">
                                    <Download className="w-4 h-4 text-muted" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200 dark:border-dark-700 space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 text-muted hover:bg-gray-50 dark:hover:bg-dark-800 rounded-xl transition-colors">
                            <Archive className="w-5 h-5" />
                            <span>أرشفة المحادثة</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                            <Trash2 className="w-5 h-5" />
                            <span>حذف المحادثة</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-muted">اختر محادثة لعرض التفاصيل</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-dark-900">
            <SEO {...SEO_CONFIG.messages} url="/messages" noIndex />
            <Header />

            <div className="h-[calc(100vh-64px)] flex">
                {/* Conversation List - Desktop */}
                <div className={`w-80 shrink-0 hidden lg:block`}>
                    <ConversationList />
                </div>

                {/* Conversation List - Mobile */}
                <div className={`w-full lg:hidden ${showMobileThread ? 'hidden' : 'block'}`}>
                    <ConversationList />
                </div>

                {/* Message Thread */}
                <div className={`flex-1 ${showMobileThread ? 'block' : 'hidden lg:block'}`}>
                    <MessageThread />
                </div>

                {/* Contact Details - Desktop only */}
                <div className="w-80 shrink-0 hidden xl:block">
                    <ContactDetails />
                </div>
            </div>
        </div>
    );
}
