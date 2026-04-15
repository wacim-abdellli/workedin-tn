with open(r'src\pages\JobDetail.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

marker_start = 'page-enter min-h-screen bg-[var(--page-bg)]'
idx = content.find(marker_start)
# Go back to find the full return statement start
return_idx = content.rfind('  return (', 0, idx)
export_idx = content.rfind('\nexport default JobDetail;')

print(f'return_idx={return_idx}, export_idx={export_idx}')
print(repr(content[return_idx:return_idx+80]))
print(repr(content[export_idx-30:export_idx+30]))
