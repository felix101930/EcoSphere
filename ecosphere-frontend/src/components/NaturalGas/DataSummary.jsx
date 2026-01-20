// Data Summary Component - Display data source and period information
import { Paper, Typography, Grid } from '@mui/material';
import { DATA_CONFIG } from '../../lib/constants/naturalGas';

function DataSummary({ dataSource, dateFrom, dateTo, count }) {
    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Data Summary
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                        Data Source
                    </Typography>
                    <Typography variant="body1">
                        {dataSource}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                        Period
                    </Typography>
                    <Typography variant="body1">
                        {dateFrom.toLocaleDateString()} - {dateTo.toLocaleDateString()}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                        Total Months
                    </Typography>
                    <Typography variant="body1">
                        {count}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                        Unit
                    </Typography>
                    <Typography variant="body1">
                        {DATA_CONFIG.UNIT} ({DATA_CONFIG.UNIT_LABEL})
                    </Typography>
                </Grid>
            </Grid>
        </Paper>
    );
}

export default DataSummary;
