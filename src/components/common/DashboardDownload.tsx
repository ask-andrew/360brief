import React, { useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';

type Html2CanvasOptions = Parameters<typeof html2canvas>[1];

interface DashboardDownloadProps {
  dashboardRef: React.RefObject<HTMLDivElement | null>;
  fileName?: string;
}

const DashboardDownload: React.FC<DashboardDownloadProps> = ({ 
  dashboardRef,
  fileName = 'dashboard-export'
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!dashboardRef.current) return;
    
    setIsDownloading(true);
    message.loading({ content: 'Preparing download...', key: 'download', duration: 0 });
    
    try {
      // Hide any interactive elements that shouldn't be in the screenshot
      const elementsToHide = document.querySelectorAll('.ant-tabs-nav, .ant-tabs-tab, button, a');
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
      
      // Prepare html2canvas options with proper TypeScript types
      const options: Html2CanvasOptions = {
        // Use window.devicePixelRatio for better quality on high-DPI displays
        scale: window.devicePixelRatio * 2,
        useCORS: true,
        allowTaint: true,
        // Remove scrollY as it's not a valid option
        // scrollY: -window.scrollY,
        onclone: (documentClone: Document, element: HTMLElement) => {
          // Ensure all content is visible in the clone
          const dashboard = documentClone.querySelector('.dashboard-container');
          if (dashboard) {
            (dashboard as HTMLElement).style.overflow = 'visible';
            (dashboard as HTMLElement).style.height = 'auto';
          }
          return Promise.resolve();
        }
      } as Html2CanvasOptions; // Type assertion to handle html2canvas options
      
      // Capture the dashboard
      const canvas = await html2canvas(dashboardRef.current, options);
      
      // Show interactive elements again
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.visibility = '';
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success({ content: 'Dashboard downloaded successfully!', key: 'download' });
    } catch (error) {
      console.error('Error downloading dashboard:', error);
      message.error({ content: 'Failed to download dashboard', key: 'download' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Tooltip title="Download dashboard as image">
      <Button 
        type="primary" 
        icon={<DownloadOutlined />} 
        onClick={handleDownload}
        loading={isDownloading}
        style={{ marginRight: 8 }}
      >
        Export Dashboard
      </Button>
    </Tooltip>
  );
};

export default DashboardDownload;
