import { useState } from 'react';
import { Box, Paper, Typography, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

export default function CollapsibleSection({ title, icon, children, defaultExpanded = true }) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const handleToggle = () => {
        setExpanded(!expanded);
    };

    return (
        <Paper elevation={2} sx={{ mb: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: expanded ? '1px solid #e0e0e0' : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: '#f5f5f5'
                    }
                }}
                onClick={handleToggle}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {icon}
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {title}
                    </Typography>
                </Box>
                <IconButton size="small">
                    {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
            </Box>
            <Collapse in={expanded}>
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            </Collapse>
        </Paper>
    );
}
