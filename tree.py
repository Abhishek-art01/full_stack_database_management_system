import os

IGNORE_DIRS = {
    '.git', 'venv', '__pycache__',
    '.idea', '.vscode'
}

IGNORE_FILES = {
    '.env'
}

MAX_DEPTH = 4   # adjust if needed


def is_ignored_file(name):
    return name.endswith('.pyc') or name in IGNORE_FILES


def print_tree(base_path='.', prefix=''):
    items = sorted(os.listdir(base_path))
    dirs = [i for i in items if os.path.isdir(os.path.join(base_path, i)) and i not in IGNORE_DIRS]
    files = [i for i in items if os.path.isfile(os.path.join(base_path, i)) and not is_ignored_file(i)]

    for idx, name in enumerate(dirs + files):
        path = os.path.join(base_path, name)
        is_last = idx == len(dirs + files) - 1
        connector = '`-- ' if is_last else '|-- '

        print(f"{prefix}{connector}{name}{'/' if os.path.isdir(path) else ''}")

        if os.path.isdir(path):
            new_prefix = prefix + ('    ' if is_last else '|   ')
            depth = new_prefix.count('|') + new_prefix.count(' ')
            if depth // 4 < MAX_DEPTH:
                print_tree(path, new_prefix)


print(".")
print_tree()
