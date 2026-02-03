import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmotionImageCarouselProps {
  className?: string;
  onEmotionChange?: (emotion: string, moodScore: number) => void;
}

export default function EmotionImageCarousel({ className = '', onEmotionChange }: EmotionImageCarouselProps) {
  const [currentImage, setCurrentImage] = useState<{ src: string, emotion: string } | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [imageList, setImageList] = useState<{ src: string, emotion: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // 10 emotions with 4 variations each (40 total images) - Chinese names with mood scores
  const emotionConfig = useMemo(() => ({
    '开心': { score: 90, color: 'from-yellow-300 to-pink-400', status: '心情很棒', files: ['开心_1.png', '开心_2.png', '开心_3.png', '开心_4.png'] },
    '喜悦恋爱': { score: 95, color: 'from-pink-300 to-rose-400', status: '状态极佳', files: ['喜悦恋爱_1.png', '喜悦恋爱_2.png', '喜悦恋爱_3.png', '喜悦恋爱_4.png'] },
    '治愈温暖': { score: 85, color: 'from-green-300 to-emerald-400', status: '温暖舒适', files: ['治愈温暖_1.png', '治愈温暖_2.png', '治愈温暖_3.png', '治愈温暖_4.png'] },
    '惊讶': { score: 75, color: 'from-blue-300 to-cyan-400', status: '充满惊喜', files: ['惊讶_1.png', '惊讶_2.png', '惊讶_3.png', '惊讶_4.png'] },
    '困倦': { score: 60, color: 'from-purple-200 to-indigo-300', status: '需要休息', files: ['困倦_1.png', '困倦_2.png', '困倦_3.png', '困倦_4.png'] },
    '悲伤': { score: 30, color: 'from-blue-400 to-slate-500', status: '情绪低落', files: ['悲伤_1.png', '悲伤_2.png', '悲伤_3.png', '悲伤_4.png'] },
    '害怕': { score: 25, color: 'from-gray-400 to-slate-600', status: '感到不安', files: ['害怕_1.png', '害怕_2.png', '害怕_3.png', '害怕_4.png'] },
    '生气': { score: 20, color: 'from-red-400 to-orange-500', status: '情绪激动', files: ['生气_1.png', '生气_2.png', '生气_3.png', '生气_4.png'] },
    '厌恶': { score: 15, color: 'from-gray-500 to-slate-700', status: '心情不佳', files: ['厌恶_1.png', '厌恶_2.png', '厌恶_3.png', '厌恶_4.png'] },
    '绝望': { score: 10, color: 'from-slate-600 to-gray-800', status: '需要关怀', files: ['绝望_1.png', '绝望_2.png', '绝望_3.png', '绝望_4.png'] }
  }), []);

  // Generate image list with proper URL encoding
  const generateImageList = useCallback(() => {
    const images: { src: string, emotion: string }[] = [];
    
    Object.entries(emotionConfig).forEach(([emotion, config]) => {
      config.files.forEach(filename => {
        // Properly encode the entire filename
        const encodedFilename = encodeURIComponent(filename);
        images.push({
          src: `/srcs/enjoy/${encodedFilename}`,
          emotion: emotion
        });
      });
    });
    
    return images;
  }, [emotionConfig]);

  // Simple and reliable image validation with proper URL encoding
  const validateImage = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log(`✅ Image loaded successfully: ${src}`);
        resolve(true);
      };
      img.onerror = (error) => {
        console.log(`❌ Image failed to load: ${src}`, error);
        resolve(false);
      };
      img.src = src;
      
      // Shorter timeout for faster feedback
      setTimeout(() => {
        console.log(`⏰ Image load timeout: ${src}`);
        resolve(false);
      }, 2000);
    });
  };

  // Load images with immediate feedback
  const loadImages = useCallback(async () => {
    console.log('🚀 Starting to load emotion images...');
    setIsLoading(true);
    setError('');
    
    const allImages = generateImageList();
    console.log('📋 Generated image list:', allImages.slice(0, 3), '...');
    
    // Test first few images to get quick feedback
    const testImages = allImages.slice(0, 8); // Test first 8 images
    console.log('🧪 Testing images:', testImages.map(img => img.src));
    
    const validationPromises = testImages.map(async (imageObj) => {
      const isValid = await validateImage(imageObj.src);
      return isValid ? imageObj : null;
    });

    try {
      const results = await Promise.all(validationPromises);
      const workingImages = results.filter((img): img is { src: string, emotion: string } => img !== null);
      
      console.log(`✅ Working images found: ${workingImages.length}/${testImages.length}`);
      console.log('🖼️ Working images:', workingImages.map(img => img.src));
      
      if (workingImages.length > 0) {
        // Start with working images immediately
        setImageList(workingImages);
        const firstImage = workingImages[0];
        setCurrentImage(firstImage);
        setCurrentEmotion(firstImage.emotion);
        
        const config = emotionConfig[firstImage.emotion as keyof typeof emotionConfig];
        onEmotionChange?.(config?.status || '状态不错', config?.score || 75);
        
        console.log('🎯 Successfully loaded first image:', firstImage.src);
        console.log('😊 Detected emotion:', firstImage.emotion);
        setIsLoading(false);
        
        // Continue loading remaining images in background
        const remainingImages = allImages.slice(8);
        if (remainingImages.length > 0) {
          setTimeout(async () => {
            console.log('🔄 Loading remaining images...');
            const remainingPromises = remainingImages.map(async (imageObj) => {
              const isValid = await validateImage(imageObj.src);
              return isValid ? imageObj : null;
            });
            
            const remainingResults = await Promise.all(remainingPromises);
            const additionalImages = remainingResults.filter((img): img is { src: string, emotion: string } => img !== null);
            
            if (additionalImages.length > 0) {
              setImageList(prev => [...prev, ...additionalImages]);
              console.log(`➕ Loaded additional images: ${additionalImages.length}`);
            }
          }, 500);
        }
      } else {
        // No images loaded, show error
        console.error('❌ No working images found');
        setError('无法加载表情图片');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('💥 Error loading images:', err);
      setError('加载失败');
      setIsLoading(false);
    }
  }, [generateImageList, emotionConfig, onEmotionChange]);

  // Change image with emotion and mood update
  const changeImage = useCallback(() => {
    if (imageList.length > 0) {
      const randomIndex = Math.floor(Math.random() * imageList.length);
      const selectedImage = imageList[randomIndex];
      setCurrentImage(selectedImage);
      setCurrentEmotion(selectedImage.emotion);
      
      const config = emotionConfig[selectedImage.emotion as keyof typeof emotionConfig];
      onEmotionChange?.(config?.status || '状态不错', config?.score || 75);
      
      console.log('🔄 Changed to image:', selectedImage.src, 'Emotion:', selectedImage.emotion);
    }
  }, [imageList, emotionConfig, onEmotionChange]);

  // Initialize
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Set up auto-change interval
  useEffect(() => {
    if (imageList.length > 0) {
      const interval = setInterval(changeImage, 10 * 60 * 1000); // 10 minutes
      return () => clearInterval(interval);
    }
  }, [imageList, changeImage]);

  // Get current emotion config for styling
  const currentConfig = currentEmotion ? emotionConfig[currentEmotion as keyof typeof emotionConfig] : emotionConfig['开心'];

  // Loading state with better UX
  if (isLoading) {
    return (
      <div className={`relative w-32 h-32 flex items-center justify-center ${className}`}>
        {/* Simplified loading animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-3 border-purple-100 border-t-purple-500 rounded-full"
        />
        
        {/* Loading text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xs text-slate-500 mt-20 font-medium"
          >
            加载中...
          </motion.span>
        </div>
      </div>
    );
  }

  // Error state with fallback
  if (error || !currentImage) {
    return (
      <div className={`relative w-32 h-32 flex items-center justify-center ${className}`}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-200 to-indigo-300 shadow-lg flex flex-col items-center justify-center border-4 border-white/20"
        >
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-4xl mb-2"
          >
            😊
          </motion.div>
          <div className="text-xs text-slate-600 text-center px-2 font-medium">
            默认表情
          </div>
        </motion.div>
        {error && (
          <div className="absolute -bottom-8 left-0 right-0 text-xs text-red-500 text-center">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-32 h-32 flex items-center justify-center ${className}`}>
      {/* Background glow effect with dynamic colors */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute inset-0 rounded-full blur-2xl bg-gradient-to-tr ${currentConfig.color} opacity-40`}
      />

      {/* Main image container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImage.src}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ 
            duration: 0.6, 
            ease: "easeOut"
          }}
          whileHover={{ 
            scale: 1.05,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.95 }}
          onClick={changeImage}
          className="relative w-28 h-28 rounded-full overflow-hidden shadow-xl border-3 border-white/30 cursor-pointer"
        >
          <img
            src={currentImage.src}
            alt={`${currentEmotion}表情`}
            className="w-full h-full object-cover"
            onError={() => {
              console.warn('Image failed to load:', currentImage.src);
              changeImage();
            }}
            loading="eager"
          />
          
          {/* Simple overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/5" />
          
          {/* Click ripple effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 2, opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-full bg-white/20"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}