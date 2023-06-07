import strftime from 'strftime'


const numberFmt0 = Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const numberFmt1 = Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
const numberFmt2 = Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const currencyFmt0 = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
const currencyFmt1 = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 1 })
const currencyFmt2 = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 })

export const CHART_HEIGHT = 700
export const YAXIS_WIDTH = 65
export const tooltipLabelFormatter = (label, args) => {
    if (!label) {
        return
    }

    if (label.constructor !== Date) {
        label = new Date(label * 1000)
    }
    const item = args && args[0] && args[0].payload && args[0]
    const dateFmtString = '%d.%m'
    const date = strftime(dateFmtString, label)
    const all = item && (item.payload.all)
    if (all) {
        if (item && item.unit === '%') {
            return date
        }
        return `${date}, ${formatNumber(all, { currency: true, compact: true })}`
    }
    return date
}
export const formatNumber = (value, opts = {}) => {
    const currency = !!opts.currency
    const compact = !!opts.compact

    if (currency && !compact) {
        return _getCurrencyFmt(value).format(value)
    }

    const display = compact ? compactNumber(value) : _getNumberFmt(value).format(value)
    if (currency) {
        return `$${display}`
    }
    return display
}
function _getNumberFmt(value) {
    const absValue = Math.abs(value)
    if (absValue < 10) {
        return numberFmt2
    } else if (absValue < 1000) {
        return numberFmt1
    } else {
        return numberFmt0
    }
}
function _getCurrencyFmt(value) {
    const absValue = Math.abs(value)
    if (absValue < 10) {
        return currencyFmt2
    } else if (absValue < 1000) {
        return currencyFmt1
    } else {
        return currencyFmt0
    }
}
export const compactNumber = value => {
    const abs = Math.abs(value)
    if (abs >= 1e9) {
        return `${(value / 1e9).toFixed(abs < 1e10 ? 2 : 1)}B`
    }
    if (abs >= 1e6) {
        return `${(value / 1e6).toFixed(abs < 1e7 ? 2 : 1)}M`
    }
    if (abs >= 1e3) {
        return `${(value / 1e3).toFixed(abs < 1e4 ? 2 : 1)}K`
    }
    return `${value.toFixed(2)}`
}
export const yaxisFormatterNumber = value => {
    return compactNumber(value)
}
export const tooltipFormatterNumber = (value, name, item) => {
    return formatNumber(value)
}