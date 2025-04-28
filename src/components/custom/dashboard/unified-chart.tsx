// 'use client';

// import { useState, useCallback } from 'react';
// import { ChartDataPoint } from '@/types/device';
// import ChartCard from '@/components/custom/dashboard/chart-card';
// import CustomTooltip from '@/components/custom/dashboard/custom-tooltip';
// import { styles } from '@/utils/styles';
// import { metrics } from '@/constants/metric';
// import {
//     LineChart,
//     Line,
//     BarChart,
//     Bar,
//     AreaChart,
//     Area,
//     XAxis,
//     YAxis,
//     Tooltip,
//     ResponsiveContainer,
//     CartesianGrid,
//     Legend,
//     ReferenceArea,
// } from 'recharts';
// import { formatDateTime } from '@/utils/date';
// import { Payload } from 'recharts/types/component/DefaultLegendContent';

// interface UnifiedChartProps {
//     data: ChartDataPoint[];
//     chartType: 'line' | 'bar' | 'area';
//     selectedMetrics?: string[];
//     onRefresh?: () => void;
// }

// interface ZoomState {
//     left: string | number;
//     right: string | number;
//     refAreaLeft: string;
//     refAreaRight: string;
//     top: string | number;
//     bottom: string | number;
//     animation: boolean;
// }

// interface ZoomEvent {
//     activeLabel?: string;
// }

// interface LegendTooltipState {
//     metricKey: string | null;
//     x: number;
//     y: number;
// }

// const CustomLegend: React.FC<{
//     payload?: Payload[];
//     onMouseEnter: (metricKey: string, x: number, y: number) => void;
//     onMouseLeave: () => void;
// }> = ({ payload, onMouseEnter, onMouseLeave }) => {
//     return (
//         <div className={styles.legendContainer}>
//             {payload?.map((entry) => {
//                 if (!entry.dataKey || typeof entry.dataKey !== 'string') return null;
//                 const metric = metrics.find((m) => m.key === entry.dataKey);
//                 if (!metric) return null;

//                 return (
//                     <div
//                         key={entry.dataKey}
//                         className="flex items-center gap-1 cursor-pointer"
//                         onMouseEnter={(e) => {
//                             const rect = e.currentTarget.getBoundingClientRect();
//                             onMouseEnter(metric.key, rect.left, rect.top - 100);
//                         }}
//                         onMouseLeave={onMouseLeave}
//                     >
//                         <span className={`${styles.tooltipDot} ${metric.dotClass}`} />
//                         <span className="text-muted-foreground">{entry.value}</span>
//                     </div>
//                 );
//             })}
//         </div>
//     );
// };

// export function UnifiedDashboardChart({
//     data,
//     chartType,
//     selectedMetrics = [],
//     onRefresh,
// }: UnifiedChartProps) {
//     const [zoomState, setZoomState] = useState<ZoomState>({
//         left: 'dataMin',
//         right: 'dataMax',
//         refAreaLeft: '',
//         refAreaRight: '',
//         top: 'dataMax',
//         bottom: 'dataMin',
//         animation: true,
//     });
//     const [legendTooltip, setLegendTooltip] = useState<LegendTooltipState>({ metricKey: null, x: 0, y: 0 });

//     // Limit data to 100 points
//     const limitedData = data.slice(-100);
//     const isDataLimited = data.length > 100;

//     const handleZoomStart = useCallback((event: ZoomEvent) => {
//         const label = event?.activeLabel;
//         if (!label) return;

//         setZoomState((prev) => ({
//             ...prev,
//             refAreaLeft: label,
//         }));
//     }, []);

//     const handleZoomMove = useCallback(
//         (event: ZoomEvent) => {
//             const label = event?.activeLabel;
//             if (!label || !zoomState.refAreaLeft) return;

//             setZoomState((prev) => ({
//                 ...prev,
//                 refAreaRight: label,
//             }));
//         },
//         [zoomState.refAreaLeft]
//     );

//     const handleZoomEnd = useCallback(() => {
//         if (!zoomState.refAreaLeft || !zoomState.refAreaRight) {
//             return;
//         }

//         const left = zoomState.refAreaLeft;
//         const right = zoomState.refAreaRight;

//         setZoomState((prev) => ({
//             ...prev,
//             refAreaLeft: '',
//             refAreaRight: '',
//             left: left > right ? right : left,
//             right: left > right ? left : right,
//         }));
//     }, [zoomState]);

//     const handleLegendMouseEnter = useCallback((metricKey: string, x: number, y: number) => {
//         setLegendTooltip({ metricKey, x, y });
//     }, []);

//     const handleLegendMouseLeave = useCallback(() => {
//         setLegendTooltip({ metricKey: null, x: 0, y: 0 });
//     }, []);

//     const renderChart = () => {
//         const commonProps = {
//             data: limitedData,
//             margin: { top: 20, right: 30, left: 20, bottom: 70 },
//             ...(chartType === 'line' && {
//                 onMouseDown: handleZoomStart,
//                 onMouseMove: handleZoomMove,
//                 onMouseUp: handleZoomEnd,
//             }),
//         };

//         const ChartComponent = chartType === 'line' ? LineChart : chartType === 'bar' ? BarChart : AreaChart;

//         return (
//             <ChartComponent {...commonProps}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis
//                     dataKey="time"
//                     stroke="#888888"
//                     fontSize={12}
//                     angle={-45}
//                     textAnchor="end"
//                     height={70}
//                     interval="preserveStartEnd"
//                     tick={{ fill: '#888888' }}
//                     domain={chartType === 'line' ? [zoomState.left, zoomState.right] : undefined}
//                     tickFormatter={(tick) => formatDateTime(tick, isDataLimited)}
//                 />
//                 <YAxis
//                     yAxisId="left"
//                     orientation="left"
//                     stroke="#888888"
//                     tick={{ fill: '#888888' }}
//                 />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Legend
//                     verticalAlign="top"
//                     height={36}
//                     content={(props) => (
//                         <CustomLegend
//                             {...props}
//                             onMouseEnter={handleLegendMouseEnter}
//                             onMouseLeave={handleLegendMouseLeave}
//                         />
//                     )}
//                 />
//                 {metrics
//                     .filter((metric) => selectedMetrics.length === 0 || selectedMetrics.includes(metric.key))
//                     .map((metric) => {
//                         if (chartType === 'line') {
//                             return (
//                                 <Line
//                                     key={metric.key}
//                                     type="monotone"
//                                     dataKey={metric.key}
//                                     name={metric.name}
//                                     stroke={metric.color}
//                                     yAxisId="left"
//                                     dot={false}
//                                     strokeWidth={1.5}
//                                     activeDot={{ r: 4, strokeWidth: 0 }}
//                                     className={styles.chartLine}
//                                     isAnimationActive={true}
//                                     animationDuration={200}
//                                     animationEasing="ease-in-out"
//                                 />
//                             );
//                         } else if (chartType === 'bar') {
//                             return (
//                                 <Bar
//                                     key={metric.key}
//                                     dataKey={metric.key}
//                                     name={metric.name}
//                                     fill={metric.color}
//                                     yAxisId="left"
//                                     className={styles.chartLine}
//                                     isAnimationActive={true}
//                                     animationDuration={200}
//                                     animationEasing="ease-in-out"
//                                 />
//                             );
//                         } else {
//                             return (
//                                 <Area
//                                     key={metric.key}
//                                     type="monotone"
//                                     dataKey={metric.key}
//                                     name={metric.name}
//                                     stroke={metric.color}
//                                     fill={metric.color}
//                                     fillOpacity={0.3}
//                                     yAxisId="left"
//                                     className={styles.chartLine}
//                                     isAnimationActive={true}
//                                     animationDuration={200}
//                                     animationEasing="ease-in-out"
//                                 />
//                             );
//                         }
//                     })}
//                 {chartType === 'line' && zoomState.refAreaLeft && zoomState.refAreaRight && (
//                     <ReferenceArea
//                         yAxisId="left"
//                         x1={zoomState.refAreaLeft}
//                         x2={zoomState.refAreaRight}
//                         strokeOpacity={0.3}
//                     />
//                 )}
//             </ChartComponent>
//         );
//     };

//     return (
//         <ChartCard
//             title={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`}
//             dataLength={limitedData.length}
//             onRefresh={onRefresh}
//         >
//             <div className={styles.chartWrapper}>
//                 <ResponsiveContainer width="100%" height={400}>
//                     {renderChart()}
//                 </ResponsiveContainer>
//                 {legendTooltip.metricKey && (
//                     <div
//                         className={styles.legendTooltip}
//                         data-x={legendTooltip.x}
//                         data-y={legendTooltip.y}
//                     >
//                         {(() => {
//                             const metric = metrics.find((m) => m.key === legendTooltip.metricKey);
//                             if (!metric) return null;
//                             return (
//                                 <div className={styles.tooltipGrid}>
//                                     <div className={styles.tooltipLabel}>
//                                         {metric.name} ({metric.unit})
//                                     </div>
//                                     <p className="text-xs text-muted-foreground">{metric.description}</p>
//                                 </div>
//                             );
//                         })()}
//                     </div>
//                 )}
//             </div>
//         </ChartCard>
//     );
// }