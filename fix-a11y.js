const fs = require('fs');
let code = fs.readFileSync('src/pages/Messages.tsx', 'utf-8');

// 1. Unread count accessibility
code = code.replace(
  /<span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs text-brand-text shadow-sm font-semibold shrink-0">\s*\{conversation\.unread_count\}\s*<\/span>/,
  '<span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs text-brand-text shadow-sm font-semibold shrink-0" aria-label={`${conversation.unread_count} unread messages`}>\n                                                {conversation.unread_count}\n                                                <span className="sr-only">unread messages</span>\n                                            </span>'
);

// 2. Message read indicators (need careful replacement)
code = code.replace(
  /\{message\.sender_id === user\?\.id && \(message\.is_read \? ' ✓✓' : ' ✓'\)\}/,
  '{message.sender_id === user?.id && <span aria-label={message.is_read ? \'Read\' : \'Delivered\'}>{message.is_read ? \' ✓✓\' : \' ✓\'}</span>}'
);
// Some files have different unicode variations
code = code.replace(
  /\{message\.sender_id === user\?\.id && \(message\.is_read \? ' ✔✓' : ' ✓'\)\}/,
  '{message.sender_id === user?.id && <span aria-label={message.is_read ? \'Read\' : \'Delivered\'}>{message.is_read ? \' ✓✓\' : \' ✓\'}</span>}'
);
code = code.replace(
  /\{message\.sender_id === user\?\.id && \(message\.is_read \? ' ✓✓' : ' ✓'\)\}/,
  '{message.sender_id === user?.id && <span aria-label={message.is_read ? \'Read\' : \'Delivered\'}>{message.is_read ? \' ✓✓\' : \' ✓\'}</span>}'
);


// 3. Mobile thread back button
code = code.replace(
  /className="lg:hidden p-2 hover:bg-surface rounded-lg transition-colors"/,
  'aria-label="Back" className="lg:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface rounded-lg transition-colors"'
);

// 4. Phone, Video, More
code = code.replace(
  /<button className="p-2 hover:bg-surface rounded-lg transition-colors" disabled>\s*<Phone/,
  '<button aria-label="Audio call" className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface rounded-lg transition-colors" disabled>\n                                <Phone'
);
code = code.replace(
  /<button className="p-2 hover:bg-surface rounded-lg transition-colors" disabled>\s*<Video/,
  '<button aria-label="Video call" className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface rounded-lg transition-colors" disabled>\n                                <Video'
);
code = code.replace(
  /<button className="p-2 hover:bg-surface rounded-lg transition-colors" disabled>\s*<MoreVertical/,
  '<button aria-label="More options" className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface rounded-lg transition-colors" disabled>\n                                <MoreVertical'
);

// 5. Input area buttons

code = code.replace(
  /className="p-2 hover:bg-surface rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"/,
  'aria-label="Attach file" className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"'
);

code = code.replace(
  /className={`p-2 rounded-full transition-all duration-300 w-12 h-12 flex items-center justify-center \$\{/,
  'aria-label={isRecording ? "Stop recording" : "Start recording"} className={`p-3 min-w-[48px] min-h-[48px] rounded-full transition-all duration-300 flex items-center justify-center ${'
);

// 6. Inline X buttons for files / audio - they used "p-1" previously
code = code.replace(
  /className="p-1 hover:bg-background rounded transition-colors disabled:opacity-50"/g,
  'aria-label="Remove attached item" className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-background rounded-full transition-colors disabled:opacity-50"'
);

code = code.replace(
  /className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900\/40 rounded transition-colors"/,
  'aria-label="Stop recording" className="ml-auto p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full transition-colors"'
);


fs.writeFileSync('src/pages/Messages.tsx', code);
console.log('Replacements completed.');
