// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React, { useState, useRef } from 'react';

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleImageUpload(file);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };
  
  const handleImageUpload = (file: File) => {
    // 检查文件类型
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      alert('请上传 JPG 或 PNG 格式的图片！');
      return;
    }
    
    // 检查文件大小 (10MB = 10 * 1024 * 1024 bytes)
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB！');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        setUploadedImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* 顶部导航栏 */}
      <header className="bg-gradient-to-r from-pink-500 to-purple-600 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="https://readdy.ai/api/search-image?query=colorful%20birthday%20cake%20logo%20with%20happy%20birthday%20text%2C%20modern%20minimalist%20design%2C%20vibrant%20colors%2C%20professional%20branding%2C%20clean%20background%2C%20celebration%20theme%2C%20festive%20appearance&width=80&height=80&seq=logo1&orientation=squarish" 
              alt="Happy Birthday Images Logo" 
              className="h-12 w-auto mr-3"
            />
            <h1 className="text-2xl font-bold text-white">Happy Birthday Images</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="text-white hover:text-pink-200 transition-colors cursor-pointer whitespace-nowrap !rounded-button">
                <i className="fas fa-globe mr-2"></i>
                中文
                <i className="fas fa-chevron-down ml-2 text-xs"></i>
              </button>
            </div>
            
            <button className="bg-white text-purple-600 px-4 py-2 rounded-full hover:bg-pink-100 transition-colors font-medium cursor-pointer whitespace-nowrap !rounded-button">
              <i className="fas fa-user mr-2"></i>登录/注册
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 介绍文案 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">创建独特的生日贺卡，传递您的祝福</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">上传照片，添加个性化文字和特效，制作专属生日贺卡，让您的祝福更加特别</p>
        </div>

        {!uploadedImage ? (
          /* 上传区域 */
          <div 
            className={`border-2 border-dashed rounded-lg p-12 max-w-3xl mx-auto text-center transition-all duration-200 ${
              isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadButtonClick}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png" 
              onChange={handleFileInputChange}
            />
            
            <div className="mb-6">
              <div className="bg-pink-100 rounded-full p-6 inline-block">
                <i className="fas fa-cloud-upload-alt text-5xl text-pink-500"></i>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-2">点击或拖拽上传照片</h3>
            <p className="text-gray-500 mb-4">支持 JPG、PNG 格式，大小不超过 10MB</p>
            
            <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap !rounded-button">
              选择图片
            </button>
          </div>
        ) : (
          /* 编辑区域 */
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* 左侧工具栏 */}
              <div className="lg:w-1/4 bg-white rounded-lg shadow-md p-4 h-fit">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">编辑工具</h3>
                
                {/* 文字编辑 */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">
                    <i className="fas fa-font mr-2 text-pink-500"></i>文字编辑
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">添加文字</label>
                      <input 
                        type="text" 
                        placeholder="输入祝福语..." 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">字体</label>
                        <button className="w-full px-3 py-2 border border-gray-300 rounded-md flex justify-between items-center text-sm cursor-pointer whitespace-nowrap !rounded-button">
                          默认
                          <i className="fas fa-chevron-down text-xs"></i>
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">大小</label>
                        <button className="w-full px-3 py-2 border border-gray-300 rounded-md flex justify-between items-center text-sm cursor-pointer whitespace-nowrap !rounded-button">
                          中等
                          <i className="fas fa-chevron-down text-xs"></i>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">颜色</label>
                      <div className="flex space-x-2">
                        {['#FF5757', '#FFD166', '#06D6A0', '#118AB2', '#073B4C', '#FFFFFF'].map((color) => (
                          <div 
                            key={color}
                            className="w-6 h-6 rounded-full cursor-pointer border border-gray-300"
                            style={{ backgroundColor: color }}
                          ></div>
                        ))}
                        <div className="w-6 h-6 rounded-full cursor-pointer border border-gray-300 flex items-center justify-center">
                          <i className="fas fa-plus text-xs text-gray-500"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 背景选择 */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">
                    <i className="fas fa-image mr-2 text-pink-500"></i>背景选择
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div 
                        key={i}
                        className="aspect-square rounded-md overflow-hidden cursor-pointer border-2 border-transparent hover:border-pink-500 transition-all"
                      >
                        <img 
                          src={`https://readdy.ai/api/search-image?query=birthday%20background%20pattern%2C%20festive%20celebration%20theme%2C%20colorful%20confetti%20and%20balloons%2C%20abstract%20design%2C%20soft%20pastel%20colors%2C%20party%20decoration%20elements&width=80&height=80&seq=bg${i}&orientation=squarish`}
                          alt={`背景 ${i}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 特效添加 */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">
                    <i className="fas fa-magic mr-2 text-pink-500"></i>特效添加
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {['蛋糕', '气球', '礼物', '彩带', '星星', '爱心', '烟花', '更多'].map((effect, index) => (
                      <div 
                        key={index}
                        className="aspect-square rounded-md bg-gray-100 flex flex-col items-center justify-center p-1 cursor-pointer hover:bg-pink-50 transition-all"
                      >
                        <i className={`fas fa-${
                          index === 0 ? 'birthday-cake' : 
                          index === 1 ? 'balloon' : 
                          index === 2 ? 'gift' : 
                          index === 3 ? 'stream' : 
                          index === 4 ? 'star' : 
                          index === 5 ? 'heart' : 
                          index === 6 ? 'sparkles' : 'plus'
                        } text-lg text-pink-500 mb-1`}></i>
                        <span className="text-xs text-gray-600">{effect}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 滤镜效果 */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    <i className="fas fa-sliders-h mr-2 text-pink-500"></i>滤镜效果
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['原图', '明亮', '柔和', '复古', '黑白', '温暖'].map((filter) => (
                      <div 
                        key={filter}
                        className="text-center cursor-pointer py-2 px-1 rounded hover:bg-pink-50 transition-all"
                      >
                        <span className="text-sm">{filter}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 右侧预览区 */}
              <div className="lg:w-3/4">
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={uploadedImage} 
                      alt="预览" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <div className="inline-block bg-white bg-opacity-80 px-6 py-3 rounded-full shadow-md">
                        <span className="text-xl font-bold text-pink-600">生日快乐！</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex justify-center space-x-4 mb-6">
                  <button className="bg-gray-200 text-gray-700 px-5 py-3 rounded-full font-medium hover:bg-gray-300 transition-all cursor-pointer whitespace-nowrap !rounded-button">
                    <i className="fas fa-undo mr-2"></i>重新上传
                  </button>
                  <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap !rounded-button">
                    <i className="fas fa-save mr-2"></i>保存贺卡
                  </button>
                  <div className="relative">
                    <button className="bg-blue-500 text-white px-5 py-3 rounded-full font-medium hover:bg-blue-600 transition-all cursor-pointer whitespace-nowrap !rounded-button">
                      <i className="fas fa-share-alt mr-2"></i>分享
                      <i className="fas fa-chevron-down ml-2 text-xs"></i>
                    </button>
                  </div>
                </div>
                
                {/* 预览缩略图 */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold mb-3">快速预览</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i}
                        className={`aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${i === 1 ? 'border-pink-500' : 'border-transparent hover:border-pink-300'} transition-all`}
                      >
                        <img 
                          src={uploadedImage} 
                          alt={`预览 ${i}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 底部区域 */}
      <footer className="bg-gray-100 mt-12 py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">关于我们</h3>
              <p className="text-gray-600 text-sm">Happy Birthday Images 提供创意生日贺卡制作服务，让您的祝福更加独特与难忘。</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">快速链接</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-pink-500 transition-colors">首页</a></li>
                <li><a href="#" className="text-gray-600 hover:text-pink-500 transition-colors">模板库</a></li>
                <li><a href="#" className="text-gray-600 hover:text-pink-500 transition-colors">使用教程</a></li>
                <li><a href="#" className="text-gray-600 hover:text-pink-500 transition-colors">常见问题</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">联系我们</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <i className="fas fa-envelope text-pink-500 mr-2"></i>
                  <span className="text-gray-600">support@happybirthdayimages.com</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-phone-alt text-pink-500 mr-2"></i>
                  <span className="text-gray-600">+86 123 4567 8901</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">关注我们</h3>
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-colors cursor-pointer">
                  <i className="fab fa-weixin"></i>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-colors cursor-pointer">
                  <i className="fab fa-weibo"></i>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-colors cursor-pointer">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-colors cursor-pointer">
                  <i className="fab fa-facebook-f"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-300 mt-8 pt-6 text-center text-sm text-gray-600">
            <p>© 2025 Happy Birthday Images. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
