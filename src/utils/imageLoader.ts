// 图片加载工具函数
export interface CarouselImage {
  src: string;
  alt: string;
  name: string;
}

/**
 * 动态加载 srcs/img 目录下的所有图片
 * 支持 png, jpg, jpeg, webp 格式
 */
export const loadCarouselImages = (): CarouselImage[] => {
  try {
    // 使用 Vite 的 import.meta.glob 动态导入图片
    const imageModules = import.meta.glob('/srcs/img/*.{png,jpg,jpeg,webp}', { 
      eager: true,
      query: '?url',
      import: 'default'
    });
    
    return Object.entries(imageModules).map(([path, url]) => {
      const fileName = path.split('/').pop() || '';
      const name = fileName.split('.')[0];
      
      return {
        src: url as string,
        alt: `轮播图片 ${name}`,
        name
      };
    }).sort((a, b) => a.name.localeCompare(b.name)); // 按文件名排序
  } catch (error) {
    console.warn('Failed to load carousel images:', error);
    return [];
  }
};

/**
 * 预加载图片
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * 批量预加载图片
 */
export const preloadImages = async (images: CarouselImage[]): Promise<void> => {
  try {
    await Promise.all(images.map(img => preloadImage(img.src)));
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
};