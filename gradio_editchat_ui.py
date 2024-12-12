import os
import json
import uuid
import shutil

import gradio as gr
from PyQt5.QtWidgets import QApplication, QFileDialog
import sys


class DataSetHandler:
    def __init__(self, dir=None):
        if dir is None:
            self._root = None
            return

        self._root = dir
        self._files = [os.path.join(dir, fname) for fname in os.listdir(dir)]
        try:
            self._files = sorted(self._files, key=lambda x: int(os.path.basename(x).split('.')[0]))
        except ValueError:
            pass
        self._length = len(self._files)
        self._idx = -1

    @staticmethod
    def empty_check(func):
        def wrapper(*args, **kwargs):
            if args[0]._root is None:
                return
            return func(*args, **kwargs)
        return wrapper

    @empty_check
    def next(self):
        if len(self._files) == 0:
            return "", "", ""
        self._idx = min(self._length-1, self._idx+1)
        with open(self._files[self._idx], encoding='utf-8') as f:
            return f"({self._idx}/{self._length-1}){os.path.basename(self._files[self._idx])}", \
                   *self.parse_conversations(f.read())
    @empty_check
    def last(self):
        if len(self._files) == 0:
            return "", "", ""
        self._idx = max(0, self._idx-1)
        with open(self._files[self._idx], encoding='utf-8') as f:
            return f"({self._idx}/{self._length-1}){os.path.basename(self._files[self._idx])}", \
                   *self.parse_conversations(f.read())

    def parse_conversations(self, file_content):
        body = json.loads(file_content)
        conversations = body['messages']

        user_content, ai_content = None, None

        for conversation in conversations:
            role = conversation['role']
            content = conversation['content']
            if role.lower() == 'user':
                user_content = content
            elif role.lower() == 'assistant':
                ai_content = content
            if user_content and ai_content:
                break

        return user_content, ai_content

    def save(self, user_content, ai_content):
        with open(self._files[self._idx], 'w', encoding='utf-8') as f:
            f.write(json.dumps({
                'messages': [
                    {
                        'role': 'user',
                        'content': user_content
                    },
                    {
                        'role': 'assistant',
                        'content': ai_content
                    }
                ]
            }))

    def add(self, user_content, ai_content):
        fname = os.path.join(self._root, f"{uuid.uuid4().hex}.json")
        self._files.insert(self._idx+1, fname)
        self._idx += 1
        self._length += 1
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(json.dumps({
                'messages': [
                    {
                        'role': 'user',
                        'content': user_content
                    },
                    {
                        'role': 'assistant',
                        'content': ai_content
                    }
                ]
            }))
        return self._files[self._idx]

    def delete(self):
        os.remove(self._files[self._idx])
        self._files.pop(self._idx)
        self._length -= 1

        self._idx = min(self._length-1, self._idx)
        with open(self._files[self._idx], encoding='utf-8') as f:
            return self._files[self._idx], *self.parse_conversations(f.read())

    def close(self):
        dirname = os.path.dirname(self._root)

        tmp = uuid.uuid4().hex

        os.makedirs(os.path.join(dirname, tmp))

        for i, fname in enumerate(self._files):
            shutil.move(fname, os.path.join(dirname, tmp, f"{i}.json"))

        shutil.rmtree(self._root)
        os.rename(os.path.join(dirname, tmp), self._root)

work_dir = 'workspace/current'
if not os.path.exists(work_dir):
    os.makedirs(work_dir)
dataset = DataSetHandler(work_dir)
export_set = None

# 函数定义：处理按钮点击和保存操作
def left_button_click(*args):
    global dataset
    try:
        file_path, user_content, ai_content = dataset.last()
        return file_path, user_content, ai_content
    except Exception:
        pass


def right_button_click(*args):
    global dataset
    try:
        file_path, user_content, ai_content = dataset.next()
        return file_path, user_content, ai_content
    except Exception:
        pass


def save_button_click(left_text, right_text):
    global dataset
    dataset.save(left_text, right_text)

def add_button_click(left_text, right_text):
    global dataset
    return dataset.add(left_text, right_text)

def delete_button_click():
    global dataset

    return dataset.delete()

def export_button_click(left_text, right_text):
    global dataset, export_set

    if export_set is None:
        folder_path = choose_dir()
        if folder_path:
            export_set = DataSetHandler(folder_path)

    export_set.add(left_text, right_text)
    return dataset.delete()


def select_button_click(*args):
    global dataset

    folder_path = choose_dir()

    if folder_path:
        dataset = DataSetHandler(folder_path)
        file_path, user_content, ai_content = dataset.next()
        return file_path, user_content, ai_content
    else:
        return "", "", ""

def choose_dir():
    try:
        # 确保有一个 QApplication 实例
        app = QApplication.instance()
        if app is None:
            app = QApplication(sys.argv)
        
        dialog = QFileDialog()
        dialog.setFileMode(QFileDialog.Directory)
        folder_path = dialog.getExistingDirectory(None, "Select Directory", "workspace")
        
        return folder_path if folder_path else None
        
    except Exception as e:
        print(f"Error in choose_dir: {str(e)}")
        return None

css = \
"""
#left_button, #right_button {
    height: 200px;  /* 增加按钮的高度 */
    width: 50px;    /* 减小按钮的宽度 */
    margin: auto;
}
#delete_button {
    background: red !important;
    color: white;
}
#export_button {
    background: black !important;
    color: white;
}
#central_row {
    display: grid;
    grid-template-columns: 1fr 15fr 15fr 1fr; /* 调整列比例，减少按钮占用的空间 */
    grid-gap: 10px; /* 消除网格之间的间隙 */
}
"""

# 创建Gradio界面
with gr.Blocks(css=css, fill_width=True, fill_height=True) as demo:
    with gr.Row():
        label = gr.Markdown("# This is a label to display text.")  # 使用Markdown显示文字
        export_button = gr.Button("Export", elem_id="export_button")
        delete_button = gr.Button("Delete", elem_id="delete_button")


    with gr.Row(elem_id="central_row"):
        with gr.Column():
            left_button = gr.Button("←", elem_id="left_button")
        with gr.Column():
            left_textbox = gr.Textbox(label="Human", lines=35, placeholder="Enter text here...")
        with gr.Column():
            right_textbox = gr.Textbox(label="AI", lines=35, placeholder="Enter text here...")
        with gr.Column():
            right_button = gr.Button("→", elem_id="right_button")
    with gr.Row():
        select_button = gr.Button("Select", elem_id="select_button")
        add_button = gr.Button("Add To DataSet", elem_id="add_button")
        save_button = gr.Button("Save", elem_id="save_button")

    delete_button.click(fn=delete_button_click, outputs=[label, left_textbox, right_textbox])

    left_button.click(fn=left_button_click,
                      inputs=[left_textbox, right_textbox],
                      outputs=[label, left_textbox, right_textbox])

    right_button.click(fn=right_button_click,
                       inputs=[left_textbox, right_textbox],
                       outputs=[label, left_textbox, right_textbox])

    select_button.click(fn=select_button_click,
                        inputs=[left_textbox, right_textbox],
                        outputs=[label, left_textbox, right_textbox])

    save_button.click(fn=save_button_click, inputs=[left_textbox, right_textbox])
    add_button.click(fn=add_button_click, inputs=[left_textbox, right_textbox], outputs=label)

    export_button.click(fn=export_button_click, inputs=[left_textbox, right_textbox],
                        outputs=[label, left_textbox, right_textbox])

# 运行Gradio界面
demo.launch()

dataset.close()
print("done")
