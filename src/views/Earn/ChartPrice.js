import React, { useEffect, useState, useCallback, useMemo } from "react";
import { RadioGroup } from '@headlessui/react'
import ChartWrapper from "./ChartWrapper";
import { useMvlpData, FROM_DATE_TS, FIRST_DATE_TS, NOW_TS, } from './dataProvider'
import { Line, ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip } from 'recharts'
import { tooltipLabelFormatter, CHART_HEIGHT, yaxisFormatterNumber, YAXIS_WIDTH, tooltipFormatterNumber, formatNumber, useWindowSize  } from './util'
import cx from "classnames";
import DownChartArrow from '../../assets/icons/down-chart-arrow.svg'
import UpChartArrow from '../../assets/icons/up-chart-arrow.svg'


const tYear = new Date().getFullYear()
const timeGroup = [
    { key: 'h', label: '1H', value: 3600, period:'daily' },
    { key: 'd', label: '1D', value: 86400, period: 'daily' },
    { key: 'w', label: '1W', value: 604800, period: 'daily' },
    { key: 'm', label: '1M', value: 2628000, period: 'daily' },
    { key: 'y', label: '1Y', value: 31536000, period: 'daily' },
    { key: 'ytd', label: 'YTD', value: parseInt(+new Date(tYear, 0, 1) / 1000), period: 'daily' },
]

export default function ChartPrice() {
    const [width, height] = useWindowSize();
    const [chartWidth,setChartWidth] = useState('100%')
    const [selectedTimeRange, setSelectedTimeRange] = useState(timeGroup[3])

    const from = selectedTimeRange.key === 'ytd' ? selectedTimeRange.value : NOW_TS - selectedTimeRange.value
    const to = NOW_TS;
    const period = selectedTimeRange.period

    const params = { from, to, period  };
    const [mvlpData, mvlpLoading] = useMvlpData(params);
    

    const priceChange = () => {
        if (mvlpData && mvlpData.length > 0) {
            const fristPrice = mvlpData[0].mvlpPrice
            const lastPrice = mvlpData[mvlpData.length - 1].mvlpPrice
            const change = ((lastPrice - fristPrice) * 100 / fristPrice).toFixed(2)

            return (

                <div style={{ textAlign: 'right' }} className="font-number">
                    <h3>${lastPrice.toFixed(2)}</h3>
                    <div className={cx({
                        positive:change > 0,
                        negative: change < 0,
                        muted: change === 0,
                    })} style={{fontSize:16,fontWeight:'normal',display:'flex',alignItems:'center',gap:4}}>
                        <img src={change > 0 ? UpChartArrow : DownChartArrow} alt="icon" />
                        <div>{Math.abs(change)}%</div>
                        <div>(${(lastPrice - fristPrice).toFixed(2)})</div>
                    </div>
                </div>

            )
        }
        
    }
    useEffect(() => {
        if (width > 1300) {
            const leftWidth = document.getElementsByClassName('Earn-content')[0].clientWidth
            setChartWidth(leftWidth - 440 - 64)
            console.log(leftWidth - 440 - 64, 'useeffct');
        } else {
            setChartWidth('100%')
        }
        
    },[width])

    return (
        <div className="chart-cell">
            <div></div>
            <ChartWrapper
                title={<div className="chart-title"><div>MVLP / USD</div> <div>{priceChange()}</div></div>}
                loading={mvlpLoading}
                data={mvlpData}
                csvFields={[
                    { key: "mvlpPrice" },
                ]}
            >
                <ResponsiveContainer width={chartWidth} height={536} debounce={3}>
                <LineChart data={mvlpData} syncId="syncMvlp">
                        <CartesianGrid stroke="#2b2b2b" strokeDasharray="5 5" />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={tooltipLabelFormatter}
                            minTickGap={30}
                        />
                        <YAxis
                            dataKey="mvlpPrice"
                            domain={['auto', 'auto']}
                            orientation="left"
                            yAxisId="right"
                            tickFormatter={yaxisFormatterNumber}
                            width={YAXIS_WIDTH}
                        />
                        <Tooltip
                            formatter={tooltipFormatterNumber}
                            labelFormatter={tooltipLabelFormatter}
                            contentStyle={{ textAlign: "left" }}
                        />
                        
                        <Line
                            isAnimationActive={false}
                            type="monotone"
                            unit="$"
                            strokeWidth={1}
                            yAxisId="right"
                            dot={false}
                            dataKey="mvlpPrice"
                            name="MVLP Price"
                            stroke={'#f2c75c'}
                        />
                    </LineChart>
                </ResponsiveContainer>
                
            </ChartWrapper>
            <div>
                <RadioGroup value={selectedTimeRange} onChange={setSelectedTimeRange} className='time-group'>
                    {timeGroup.map(item => (
                        <RadioGroup.Option
                            key={item.key}
                            value={item}
                            className={({ active, checked }) =>
                                `${checked ? 'time-checked' : 'time-unchecked'} time-option`
                            }
                        >
                            {({ active,checked}) => (
                                <>
                                    <div>{item.label}</div>
                                </>
                            )}
                        </RadioGroup.Option>
                    ))}
                </RadioGroup>
            </div>
        </div>
    )
}
