// Data Availability Card - Shows data status and algorithm selection
import { Card, CardContent, Typography } from '@mui/material';
import DataCompletenessSection from './DataCompletenessSection';
import AvailableDataChecks from './AvailableDataChecks';
import MissingPeriodsSection from './MissingPeriodsSection';
import AlgorithmSelectionSection from './AlgorithmSelectionSection';
import AlgorithmTiersGrid from './AlgorithmTiersGrid';

const DataAvailabilityCard = ({ metadata, title = 'Data Availability Analysis' }) => {
    if (!metadata) return null;

    const { dataAvailability, strategy, strategyName, confidence, accuracy, warning } = metadata;

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📊 {title}
                </Typography>

                {/* Data Completeness (only for consumption forecast) */}
                {dataAvailability && (
                    <>
                        <DataCompletenessSection
                            completenessScore={dataAvailability.completenessScore}
                            totalDataPoints={dataAvailability.totalDataPoints}
                        />

                        {/* Available Data Checks */}
                        <AvailableDataChecks dataAvailability={dataAvailability} />

                        {/* Missing Periods */}
                        <MissingPeriodsSection missingPeriods={dataAvailability.missingPeriods} />
                    </>
                )}

                {/* Algorithm Selection */}
                <AlgorithmSelectionSection
                    strategyName={strategyName}
                    confidence={confidence}
                    accuracy={accuracy}
                    warning={warning}
                />

                {/* Algorithm Tiers Grid */}
                <AlgorithmTiersGrid activeStrategy={strategy} />
            </CardContent>
        </Card>
    );
};

export default DataAvailabilityCard;
