import xml.etree.ElementTree as ET

for name in ['board_meetings_feed', 'financial_results_feed', 'announcements_feed', 'corp_action_feed']:
    path = f'research/bse/samples/{name}.xml'
    with open(path, 'r', encoding='utf-8-sig', errors='ignore') as f:
        content = f.read()
    print(f"\n==================== {name} ====================")
    print('Length:', len(content))
    try:
        root = ET.fromstring(content)
        print('Root tag:', root.tag)
        items = root.findall('.//item')
        print('Total items in feed:', len(items))
        if items:
            print("--- First Item ---")
            for child in items[0]:
                print(f"  {child.tag}: {child.text.strip() if child.text else ''}")
            if len(items) > 1:
                print("--- Second Item ---")
                for child in items[1]:
                    print(f"  {child.tag}: {child.text.strip() if child.text else ''}")
    except Exception as e:
        print('XML parse error:', e)
        print('Raw content snippet:', content[:500])
