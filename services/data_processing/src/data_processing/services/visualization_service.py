""Service for generating data visualizations."""
import os
import io
import base64
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

class VisualizationService:
    """Service for generating data visualizations."""
    
    def __init__(self, output_dir: str = "charts"):
        """Initialize with output directory for saving charts."""
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        plt.style.use('seaborn-v0_8')
    
    def generate_sender_chart(self, sender_counts: Dict[str, int], top_n: int = 10) -> str:
        """Generate bar chart of top email senders."""
        sorted_senders = sorted(sender_counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
        senders = [s[0].split('@')[0] for s in sorted_senders]
        counts = [s[1] for s in sorted_senders]
        
        fig, ax = plt.subplots(figsize=(10, 6))
        bars = ax.bar(senders, counts, color='#4e79a7')
        
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height, f'{int(height)}',
                    ha='center', va='bottom')
        
        ax.set_title('Top Email Senders', fontsize=14, fontweight='bold')
        ax.set_xlabel('Sender')
        ax.set_ylabel('Number of Emails')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        return self._figure_to_base64(fig)
    
    def generate_timeline(self, date_counts: Dict[str, int]) -> str:
        """Generate line chart of email activity over time."""
        dates = sorted([datetime.strptime(d, '%Y-%m-%d') for d in date_counts.keys()])
        counts = [date_counts[d.strftime('%Y-%m-%d')] for d in dates]
        
        fig, ax = plt.subplots(figsize=(12, 5))
        ax.plot(dates, counts, marker='o', linestyle='-', color='#e15759')
        
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
        ax.xaxis.set_major_locator(mdates.DayLocator(interval=max(1, len(dates)//5)))
        
        ax.set_title('Email Activity Over Time', fontsize=14, fontweight='bold')
        ax.set_xlabel('Date')
        ax.set_ylabel('Number of Emails')
        plt.xticks(rotation=45)
        plt.grid(True, linestyle='--', alpha=0.7)
        plt.tight_layout()
        
        return self._figure_to_base64(fig)
    
    def _figure_to_base64(self, fig) -> str:
        """Convert matplotlib figure to base64 encoded image."""
        img = io.BytesIO()
        fig.savefig(img, format='png', bbox_inches='tight', dpi=100)
        plt.close(fig)
        return f"data:image/png;base64,{base64.b64encode(img.getvalue()).decode()}"
