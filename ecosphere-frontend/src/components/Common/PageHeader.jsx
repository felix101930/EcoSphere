// PageHeader - Sticky header component for all pages
import { Box, Typography, Button } from '@mui/material';
import { FileDownload as FileDownloadIcon, History as HistoryIcon } from '@mui/icons-material';

const PageHeader = ({ 
  title, 
  subtitle, 
  showExportButton = false, 
  onExport,
  showReportLogButton = false,
  onReportLog,
  rightContent 
}) => {
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'white',
        borderBottom: '2px solid #E0E0E0',
        px: 4,
        py: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      {/* Left: Title and Subtitle */}
      <Box>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontFamily: 'Titillium Web, sans-serif',
            fontWeight: 700,
            color: '#324053',
            mb: subtitle ? 0.5 : 0
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'DM Sans, sans-serif',
              color: '#666'
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Right: Buttons or Custom Content */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {showReportLogButton && (
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={onReportLog}
            sx={{
              borderColor: '#DA291C',
              color: '#DA291C',
              '&:hover': { 
                borderColor: '#A6192E',
                bgcolor: 'rgba(218, 41, 28, 0.04)'
              },
              fontFamily: 'Titillium Web, sans-serif',
              fontWeight: 600
            }}
          >
            Report Log
          </Button>
        )}
        {showExportButton && (
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={onExport}
            sx={{
              bgcolor: '#DA291C',
              '&:hover': { bgcolor: '#A6192E' },
              fontFamily: 'Titillium Web, sans-serif',
              fontWeight: 600
            }}
          >
            Export Report
          </Button>
        )}
        {rightContent}
      </Box>
    </Box>
  );
};

export default PageHeader;
