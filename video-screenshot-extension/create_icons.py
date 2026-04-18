from PIL import Image, ImageDraw
import os

def create_icon(size, output_path):
    """创建指定尺寸的图标"""
    # 创建渐变背景
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制渐变圆形背景
    for i in range(size):
        ratio = i / size
        r = int(102 + (118 - 102) * ratio)  # 从 #667eea 到 #764ba2
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        
        # 计算圆形范围
        margin = i // 2
        draw.ellipse([margin, margin, size - margin, size - margin], 
                     fill=(r, g, b, 255))
    
    # 绘制摄像机图标（简化版）
    margin = size // 6
    camera_width = size - 2 * margin
    camera_height = int(camera_width * 0.6)
    
    # 摄像机主体
    camera_x = margin
    camera_y = (size - camera_height) // 2
    
    # 白色半透明背景 - 使用圆角矩形
    radius = size // 10
    # 手动绘制圆角矩形（兼容旧版 Pillow）
    draw.rounded_rectangle(
        [camera_x, camera_y, camera_x + camera_width, camera_y + camera_height],
        radius=radius,
        fill=(255, 255, 255, 230)
    )
    
    # 镜头（圆形）
    lens_size = int(camera_height * 0.5)
    lens_x = camera_x + camera_width // 2
    lens_y = camera_y + camera_height // 2
    draw.ellipse(
        [lens_x - lens_size//2, lens_y - lens_size//2,
         lens_x + lens_size//2, lens_y + lens_size//2],
        fill=(100, 100, 100, 255),
        outline=(150, 150, 150, 255),
        width=max(1, size // 32)
    )
    
    # 镜头高光
    highlight_size = lens_size // 3
    draw.ellipse(
        [lens_x - lens_size//4 - highlight_size//2, 
         lens_y - lens_size//4 - highlight_size//2,
         lens_x - lens_size//4 + highlight_size//2, 
         lens_y - lens_size//4 + highlight_size//2],
        fill=(255, 255, 255, 180)
    )
    
    # 保存
    img.save(output_path, 'PNG')
    print(f"Created: {output_path}")

# 获取当前脚本所在目录
script_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = os.path.join(script_dir, "icons")

# 确保目录存在
os.makedirs(output_dir, exist_ok=True)

# 创建不同尺寸的图标
icon_sizes = [16, 48, 128]

for size in icon_sizes:
    output_path = os.path.join(output_dir, f"icon{size}.png")
    create_icon(size, output_path)

print("All icons created successfully!")
print(f"Icons saved to: {output_dir}")
