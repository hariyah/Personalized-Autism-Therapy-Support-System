import json
import sys

import requests

def main():
    url = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5000').rstrip('/') + '/health'
    out = 'service_health.json'
    try:
        r = requests.get(url, timeout=30)
        data = {
            'ok': r.status_code == 200,
            'status_code': r.status_code,
            'json': None
        }
        try:
            data['json'] = r.json()
        except Exception:
            pass
    except Exception as e:
        data = {'ok': False, 'error': repr(e)}

    with open(out, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print('Wrote', out)
    # Exit code indicates health: 0=healthy, 1=unhealthy, 2=healthy-but-model-not-loaded
    if not data.get('ok'):
        sys.exit(1)
    loaded = False
    j = data.get('json') or {}
    if isinstance(j, dict):
        loaded = bool(j.get('model_loaded'))
    sys.exit(0 if loaded else 2)

if __name__ == '__main__':
    main()
