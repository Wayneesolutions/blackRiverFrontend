import React, { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { Truck, MapPin, Clock, CheckCircle, Play, Package, Calendar, TrendingUp, ChevronRight } from "lucide-react";
import NewLoad from "../NewLoad";



interface TabButtonProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: (id: string) => void;
}


// Define allowed statuses
type Status = "pending" | "started" | "enroute" | "arrived" | "reached" | "completed";

interface ProfessionalCircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  delay?: number;
}
interface StockChartProps {
  data: number[];
  height?: number;
  color?: string;
  label?: string;
}

interface ProfessionalUtilizationGaugeProps {
  activeCount: number;
  totalCount: number;
  type?: string;   // default "Truck"
  color?: string;  // default "#10b981"
}

// Define the shape of one bar
interface CandlestickBar {
  value: number;
  label: string;
  color: string;
}

// Props interface
interface CandlestickBarChartProps {
  data: CandlestickBar[];
  height?: number;
}

interface AnimatedCounterProps {
  value: number | string; // allow raw numbers or formatted strings
  duration?: number;
  prefix?: string;
  suffix?: string;
}


const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('loads');
  const [animationTrigger, setAnimationTrigger] = useState(false);


  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Trigger animations on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimationTrigger(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const statusColors: Record<Status, string> = {
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'started': 'bg-blue-100 text-blue-800 border-blue-300',
    'enroute': 'bg-purple-100 text-purple-800 border-purple-300',
    'arrived': 'bg-orange-100 text-orange-800 border-orange-300',
    'reached': 'bg-green-100 text-green-800 border-green-300',
    'completed': 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const statusIcons: Record<Status, ReactElement> = {
    'pending': <Clock className="w-4 h-4" />,
    'started': <Play className="w-4 h-4" />,
    'enroute': <Truck className="w-4 h-4" />,
    'arrived': <MapPin className="w-4 h-4" />,
    'reached': <CheckCircle className="w-4 h-4" />,
    'completed': <Package className="w-4 h-4" />
  };

  const loadsData = [
    {
      drivers: ["Sunny", "Sandy"],
      orderNumber: "1258969",
      orderBy: "Riya Enterprises",
      pickupLocation: "Winnipeg, MB",
      deliveryLocation: "Tauranga, NZ",
      status: "started",
      route: "Trans-Pacific",
      estimatedTime: "72 hrs",
      distance: "12,450 km",
      tags: "International, High Value",
      image: "truck-1.jpg"
    },
    {
      drivers: ["Mike Johnson"],
      orderNumber: "1259001",
      orderBy: "Global Logistics Inc",
      pickupLocation: "Toronto, ON",
      deliveryLocation: "Vancouver, BC",
      status: "enroute",
      route: "Trans-Canada Highway",
      estimatedTime: "28 hrs",
      distance: "4,400 km",
      tags: "Express, Fragile",
      image: "truck-2.jpg"
    },
    {
      drivers: ["Sarah Wilson", "Tom Brown"],
      orderNumber: "1259002",
      orderBy: "Northern Supply Co",
      pickupLocation: "Calgary, AB",
      deliveryLocation: "Edmonton, AB",
      status: "arrived",
      route: "Highway 2",
      estimatedTime: "3 hrs",
      distance: "300 km",
      tags: "Local, Same Day",
      image: "truck-3.jpg"
    },
    {
      drivers: ["Alex Turner"],
      orderNumber: "1259003",
      orderBy: "Maritime Shipping",
      pickupLocation: "Halifax, NS",
      deliveryLocation: "Montreal, QC",
      status: "reached",
      route: "Trans-Canada Highway",
      estimatedTime: "12 hrs",
      distance: "1,200 km",
      tags: "Standard",
      image: "truck-4.jpg"
    },
    {
      drivers: ["Lisa Chen", "David Kim"],
      orderNumber: "1259004",
      orderBy: "Western Distributors",
      pickupLocation: "Seattle, WA",
      deliveryLocation: "Los Angeles, CA",
      status: "pending",
      route: "I-5 South",
      estimatedTime: "18 hrs",
      distance: "1,800 km",
      tags: "Cross-border, Perishable",
      image: "truck-5.jpg"
    }
  ];

  const driversData = [
    {
      name: "Sunny",
      partner: "Sandy",
      status: "started",
      currentLocation: "Winnipeg, MB",
      nextDestination: "Vancouver, BC",
      hoursWorked: "6/14",
      lastUpdate: "2 mins ago"
    },
    {
      name: "Mike Johnson",
      partner: null,
      status: "enroute",
      currentLocation: "Thunder Bay, ON",
      nextDestination: "Vancouver, BC",
      hoursWorked: "8/14",
      lastUpdate: "15 mins ago"
    },
    {
      name: "Sarah Wilson",
      partner: "Tom Brown",
      status: "arrived",
      currentLocation: "Edmonton, AB",
      nextDestination: "Calgary, AB",
      hoursWorked: "2/14",
      lastUpdate: "1 min ago"
    },
    {
      name: "Alex Turner",
      partner: null,
      status: "reached",
      currentLocation: "Montreal, QC",
      nextDestination: "Ottawa, ON",
      hoursWorked: "10/14",
      lastUpdate: "5 mins ago"
    },
    {
      name: "Lisa Chen",
      partner: "David Kim",
      status: "pending",
      currentLocation: "Seattle, WA",
      nextDestination: "Portland, OR",
      hoursWorked: "0/14",
      lastUpdate: "30 mins ago"
    }
  ];

  const routesData = [
    {
      route: "Trans-Pacific",
      activeLoads: 1,
      totalDistance: "12,450 km",
      avgTime: "72 hrs",
      efficiency: "92%",
      status: "active"
    },
    {
      route: "Trans-Canada Highway",
      activeLoads: 2,
      totalDistance: "7,200 km",
      avgTime: "48 hrs",
      efficiency: "88%",
      status: "active"
    },
    {
      route: "Highway 2 (AB)",
      activeLoads: 1,
      totalDistance: "300 km",
      avgTime: "3 hrs",
      efficiency: "95%",
      status: "completed"
    },
    {
      route: "I-5 South",
      activeLoads: 1,
      totalDistance: "1,800 km",
      avgTime: "18 hrs",
      efficiency: "85%",
      status: "pending"
    }
  ];

  interface StatusBadgeProps {
    status: Status;
  }

  const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusColors[status]}`}
    >
      {statusIcons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  // Props type for ImagePlaceholder
  interface ImagePlaceholderProps {
    image?: string; // optional if not always passed
    alt?: string;
  }

  const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({ image, alt }) => (
    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
      {image ? (
        <img src={image} alt={alt} className="w-12 h-12 object-cover rounded-lg" />
      ) : (
        <Truck className="w-6 h-6 text-white" />
      )}
    </div>
  );

  const StockChart: React.FC<StockChartProps> = ({
    data,
    height = 60,
    color = "#10b981",
    label = "Revenue",
  }) => {
    const [animationTrigger, setAnimationTrigger] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => setAnimationTrigger(true), 300);
      return () => clearTimeout(timer);
    }, []);

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 200;
      const y = height - ((value - minValue) / range) * (height - 10);
      return { x, y, value };
    });

    const pathData = points.map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return (
      <div className="w-full relative">
        <svg width="200" height={height} className="w-full overflow-visible">
          <defs>
            <linearGradient id={`stockGradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="50%" stopColor={color} stopOpacity="0.1" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <filter id={`stockGlow-${label}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[...Array(4)].map((_, i) => (
            <line
              key={i}
              x1="0"
              y1={i * (height / 3)}
              x2="200"
              y2={i * (height / 3)}
              stroke="rgba(156, 163, 175, 0.2)"
              strokeWidth="0.5"
            />
          ))}

          {/* Area fill */}
          <path
            d={`M 0 ${height} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L 200 ${height} Z`}
            fill={`url(#stockGradient-${label})`}
            opacity={animationTrigger ? 1 : 0}
            style={{ transition: 'opacity 1s ease-out 0.5s' }}
          />

          {/* Main line with glow */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#stockGlow-${label})`}
            style={{
              strokeDasharray: '500',
              strokeDashoffset: animationTrigger ? '0' : '500',
              transition: 'stroke-dashoffset 1.5s ease-out',
            }}
          />

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="white"
                stroke={color}
                strokeWidth="2"
                className="opacity-0 cursor-pointer transition-all duration-200"
                style={{
                  animation: animationTrigger ? `fadeIn 0.3s ease-out ${1 + index * 0.05}s forwards` : 'none'
                }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {hoveredPoint === index && (
                <g>
                  <rect
                    x={point.x - 25}
                    y={point.y - 30}
                    width="50"
                    height="20"
                    fill="rgba(17, 24, 39, 0.9)"
                    rx="4"
                  />
                  <text
                    x={point.x}
                    y={point.y - 16}
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="500"
                  >
                    ${point.value.toFixed(2)}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
        <style>{`
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      `}</style>
      </div>
    );
  };

  // Enhanced Utilization Gauge with Individual Hover
  const ProfessionalUtilizationGauge: React.FC<ProfessionalUtilizationGaugeProps> = ({
    activeCount,
    totalCount,
    type = "Truck",
    color = "#10b981",
  }) => {
    const [animationTrigger, setAnimationTrigger] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => setAnimationTrigger(true), 100);
      return () => clearTimeout(timer);
    }, []);

    const utilization = (activeCount / totalCount) * 100;

    return (
      <div className="flex items-center space-x-4">
        {/* Radial Progress */}
        <div className="relative">
          <svg width="80" height="80" className="transform -rotate-90">
            <defs>
              <radialGradient id={`radialGrad-${type}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={color} stopOpacity="0.1" />
                <stop offset="70%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.8" />
              </radialGradient>
            </defs>
            <circle
              cx="40"
              cy="40"
              r="35"
              stroke="rgba(156, 163, 175, 0.2)"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="35"
              stroke={`url(#radialGrad-${type})`}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 35}
              strokeDashoffset={animationTrigger ? 2 * Math.PI * 35 * (1 - utilization / 100) : 2 * Math.PI * 35}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 2s ease-out 0.3s' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color }}>
                <AnimatedCounter value={activeCount} />
              </div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
          </div>
        </div>

        {/* Individual Status Bars */}
        <div className="flex flex-col space-y-1">
          {Array.from({ length: Math.min(6, totalCount) }, (_, i) => (
            <div
              key={i}
              className="relative"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`w-8 h-2 rounded-full transition-all duration-300 ${i < activeCount ? 'bg-gradient-to-r' : 'bg-gray-200'
                  }`}
                style={i < activeCount ? {
                  backgroundImage: `linear-gradient(90deg, ${color}40, ${color})`
                } : {}}
              />
              {hoveredIndex === i && (
                <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-20">
                  {type} {i + 1}: {i < activeCount ? 'Active' : 'Idle'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CandlestickBarChart: React.FC<CandlestickBarChartProps> = ({
    data,
    height = 100,
  }) => {
    const [animationTrigger, setAnimationTrigger] = useState<boolean>(false);
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => setAnimationTrigger(true), 200);
      return () => clearTimeout(timer);
    }, []);

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    const padding = range * 0.1;
    const chartMax = maxValue + padding;
    const chartMin = minValue - padding;
    const chartRange = chartMax - chartMin;

    return (
      <div className="flex items-end justify-between gap-1" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = ((item.value - chartMin) / chartRange) * (height - 20);

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center group cursor-pointer"
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div className="relative w-full flex justify-center items-end" style={{ height: height - 20 }}>
                {/* Single animated bar */}
                <div
                  className="w-full max-w-8 rounded-t-sm transition-all duration-700 ease-out relative overflow-hidden"
                  style={{
                    height: animationTrigger ? `${barHeight}px` : '0px',
                    background: `linear-gradient(0deg, ${item.color}80 0%, ${item.color}CC 50%, ${item.color} 100%)`,
                    transitionDelay: `${index * 100}ms`,
                    transform: hoveredBar === index ? 'scaleY(1.05) scaleX(1.1)' : 'scaleY(1) scaleX(1)',
                    transformOrigin: 'bottom',
                    boxShadow: hoveredBar === index
                      ? `0 8px 25px -5px ${item.color}40, 0 0 0 1px ${item.color}20`
                      : `0 2px 8px -2px ${item.color}30`,
                    minHeight: animationTrigger ? '4px' : '0px'
                  }}
                >
                  {/* Shine effect on hover */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/40 transition-opacity duration-300"
                    style={{
                      opacity: hoveredBar === index ? 0.7 : 0
                    }}
                  />
                </div>

                {/* Hover tooltip */}
                {hoveredBar === index && (
                  <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-20 shadow-xl">
                    <div className="font-semibold">${item.value.toLocaleString()}</div>
                    <div className="text-gray-300 text-center">{item.label}</div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="text-xs text-center mt-2 font-medium text-gray-600 transition-colors duration-200"
                style={{ color: hoveredBar === index ? item.color : '' }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  // Enhanced Animated Counter with Professional Easing
  const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    duration = 2000,
    prefix = "",
    suffix = "",
  }) => {
    const [count, setCount] = useState(0);
    const [animationTrigger, setAnimationTrigger] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setAnimationTrigger(true), 100);
      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      if (!animationTrigger) return;

      let startTime: number | null = null;
      const startValue = 0;
      const endValue = parseFloat(value.toString().replace(/[^\d.]/g, ""));

      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeOut;

        if (prefix === "$" && endValue > 100) {
          setCount(Math.floor(currentValue));
        } else {
          // Ensure we store number, not string
          setCount(
            Number(
              currentValue.toFixed(
                value.toString().includes(".") ? 2 : 0
              )
            )
          );
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [animationTrigger, value, duration, prefix]);


    const displayValue =
      prefix === "$" && count > 100
        ? Math.floor(count).toLocaleString()
        : count.toString();

    return <span>{prefix}{displayValue}{suffix}</span>;
  };



  const ProfessionalCircularProgress: React.FC<ProfessionalCircularProgressProps> = ({
    percentage,
    size = 140,
    strokeWidth = 10,
    color = "#16a34a",
    backgroundColor = "#f1f5f9",
    children,
    delay = 0,
  }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState<number>(0);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [animationTrigger, setAnimationTrigger] = useState<boolean>(false);

    useEffect(() => {
      const timer = setTimeout(() => setAnimationTrigger(true), 100);
      return () => clearTimeout(timer);
    }, []);


    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    useEffect(() => {
      if (!animationTrigger) return;

      const timer = setTimeout(() => {
        let start: number | null = null;

        const animate = (timestamp: number) => {
          if (start === null) start = timestamp;
          const progress = Math.min((timestamp - start) / 2000, 1);

          // Smooth easing
          const easeOut = 1 - Math.pow(1 - progress, 3);
          setAnimatedPercentage(percentage * easeOut);

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }, delay);

      return () => clearTimeout(timer);
    }, [animationTrigger, percentage, delay]);

    const offset = circumference - (animatedPercentage / 100) * circumference;

    return (
      <div
        className={`relative flex items-center justify-center transition-all duration-300 ${isHovered ? 'scale-105' : 'scale-100'
          }`}
        style={{ width: size, height: size }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={`gradient-${Math.random()}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.8" />
            </linearGradient>
            <filter id="progressGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            filter={isHovered ? "url(#progressGlow)" : "none"}
            style={{
              transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>

        {/* Percentage indicator on hover */}
        {isHovered && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs">
            {Math.round(animatedPercentage)}%
          </div>
        )}
      </div>
    );
  };

  const renderDashboardMetrics = () => {
    return (
      <div className="space-y-8 mb-8">
        {/* Top Row - Professional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Dispatch Efficiency */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 font-semibold text-sm">Dispatch Efficiency</h3>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-gray-800">
                  <AnimatedCounter value="6" suffix="/24" />
                </div>
                <div className="text-xs text-gray-500">Truck Utilization</div>
                <ProfessionalUtilizationGauge
                  activeCount={6}
                  totalCount={24}
                  type="Truck"
                  color="#3b82f6"
                />
              </div>
            </div>
          </div>

          {/* Active Service */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-emerald-50 rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 font-semibold text-sm">Active Service</h3>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-gray-800">
                  <AnimatedCounter value="4" suffix="/30" />
                </div>
                <div className="text-xs text-gray-500">Trailer Utilization</div>
                <ProfessionalUtilizationGauge
                  activeCount={4}
                  totalCount={30}
                  type="Trailer"
                  color="#10b981"
                />
              </div>
            </div>
          </div>

          {/* Revenue Per Mile */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-green-50 rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-gray-800">
                  $<AnimatedCounter value="4.80" />
                </div>
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  10% ↗
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-3">Revenue Per Mile</div>
              <StockChart
                data={[3.2, 3.8, 3.5, 4.1, 3.9, 4.3, 4.0, 4.6, 4.2, 4.8]}
                height={50}
                color="#16a34a"
                label="rpm"
              />
            </div>
          </div>

          {/* Incoming Revenue */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-teal-50 rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="text-right mb-4">
                <div className="text-lg font-bold text-gray-800 mb-1">
                  $<AnimatedCounter value="351457" /> INCOMING
                </div>
                <div className="text-xs text-gray-500 mb-3">30 Day Cashflow</div>
              </div>
              <CandlestickBarChart
                data={[
                  { label: 'W1', value: 280000, color: '#64748b' },
                  { label: 'W2', value: 320000, color: '#14b8a6' },
                  { label: 'W3', value: 290000, color: '#0d9488' },
                  { label: 'W4', value: 350000, color: '#14b8a6' },
                  { label: 'W5', value: 351457, color: '#0f766e' }
                ]}
                height={80}
              />
            </div>
          </div>
        </div>

        {/* Bottom Row - Billing Circles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Invoices Not Sent */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-700 font-semibold">Billing</h3>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-500 transition-colors" />
            </div>
            <div className="flex items-center justify-center">
              <ProfessionalCircularProgress
                percentage={75}
                size={160}
                strokeWidth={12}
                color="#16a34a"
                delay={200}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">
                    $<AnimatedCounter value="21250" />
                  </div>
                  <div className="text-xs text-gray-500">22 - 48 HRS</div>
                  <div className="text-sm text-gray-600 font-medium mt-1">Invoices Not Sent</div>
                </div>
              </ProfessionalCircularProgress>
            </div>
          </div>


          {/* Payment Status - Alternative Design */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 shadow-xl border border-red-100 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23dc2626' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20z'/%3E%3C/g%3E%3C/svg%3E")`
              }} />
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h3 className="text-red-700 font-semibold">Payment Status</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
              </div>

              {/* Main Content - Left/Right Layout */}
              <div className="flex items-center justify-between">
                {/* Left Side - Payment Info */}
                <div className="flex-1">
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    $<AnimatedCounter value="440528" />
                  </div>
                  <div className="text-sm text-gray-600">Total Outstanding</div>
                </div>

                {/* Right Side - Line Chart */}
                <div className="flex-1 max-w-xs">
                  <div className="text-xs text-gray-500 mb-3">Payment Trend (Last 30 Days)</div>
                  <StockChart
                    data={[520000, 485000, 465000, 445000, 460000, 440528]}
                    height={45}
                    color="#dc2626"
                    label="payments"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    )
  }
  const renderLoadsTable = () => (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-xl border border-white border-opacity-50 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 bg-opacity-80 backdrop-blur-sm text-left font-semibold text-gray-700">
              <th className="px-4 py-4 border-r border-gray-200 border-opacity-50">Image</th>
              <th className="px-4 py-4 border-r border-gray-200 border-opacity-50">Drivers</th>
              <th className="px-4 py-4 border-r border-gray-200 border-opacity-50">Order #</th>
              <th className="px-4 py-4 border-r border-gray-200 border-opacity-50">Customer</th>
              <th className="px-4 py-4 border-r border-gray-200 border-opacity-50">Route</th>
              <th className="px-4 py-4 border-r border-gray-200 border-opacity-50">Distance</th>
              <th className="px-4 py-4 border-r border-gray-200 border-opacity-50">ETA</th>
              <th className="px-4 py-4 border-r border-gray-200 border-opacity-50">Status</th>
              <th className="px-4 py-4">Tags</th>
            </tr>
          </thead>
          <tbody>
            {loadsData.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50 hover:bg-opacity-50 transition-colors duration-200 border-b border-gray-100 border-opacity-50">
                <td className="px-4 py-4 border-r border-gray-100 border-opacity-50">
                  <ImagePlaceholder image={row.image} alt="Truck" />
                </td>
                <td className="px-4 py-4 border-r border-gray-100 border-opacity-50 align-top">
                  {row.drivers.map((driver, i) => (
                    <div key={i} className="text-gray-800 font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      {driver}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 border-opacity-50 font-mono text-blue-600 font-semibold">
                  {row.orderNumber}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 border-opacity-50 text-gray-800 font-medium">
                  {row.orderBy}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 border-opacity-50">
                  <div className="text-gray-700 font-medium">{row.route}</div>
                  <div className="text-xs text-gray-500">{row.pickupLocation} → {row.deliveryLocation}</div>
                </td>
                <td className="px-4 py-4 border-r border-gray-100 border-opacity-50 text-gray-700">
                  {row.distance}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 border-opacity-50 text-gray-700">
                  {row.estimatedTime}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 border-opacity-50">
                  <StatusBadge status={row.status as Status} />

                </td>
                <td className="px-4 py-4 text-xs">
                  {row.tags ? (
                    <div className="flex flex-wrap gap-1">
                      {row.tags.split(', ').map((tag, i) => (
                        <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">No tags</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDriversTable = () => (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-xl border border-white border-opacity-50 shadow-xl overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 bg-opacity-80 backdrop-blur-sm text-left font-semibold text-gray-700">
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Driver</th>
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Partner</th>
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Status</th>
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Current Location</th>
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Next Destination</th>
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Hours Worked</th>
            <th className="px-6 py-4">Last Update</th>
          </tr>
        </thead>
        <tbody>
          {driversData.map((driver, idx) => (
            <tr key={idx} className="hover:bg-blue-50 hover:bg-opacity-50 transition-colors duration-200 border-b border-gray-100 border-opacity-50">
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {driver.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="font-medium text-gray-800">{driver.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 text-gray-700">
                {driver.partner || <span className="text-gray-400 italic">Solo</span>}
              </td>
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">
                <StatusBadge status={driver.status as Status} />

              </td>
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 text-gray-700">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {driver.currentLocation}
                </div>
              </td>
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 text-gray-700">
                {driver.nextDestination}
              </td>
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: animationTrigger ? `${(parseInt(driver.hoursWorked) / 14) * 100}%` : '0%',
                        transitionDelay: `${idx * 100}ms`
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{driver.hoursWorked}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-500 text-xs">
                {driver.lastUpdate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderRoutesTable = () => (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-xl border border-white border-opacity-50 shadow-xl overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 bg-opacity-80 backdrop-blur-sm text-left font-semibold text-gray-700">
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Route</th>
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Active Loads</th>
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Total Distance</th>
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Avg Time</th>
            <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Efficiency</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {routesData.map((route, idx) => (
            <tr key={idx} className="hover:bg-blue-50 hover:bg-opacity-50 transition-colors duration-200 border-b border-gray-100 border-opacity-50">
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 font-medium text-gray-800">
                {route.route}
              </td>
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                  {route.activeLoads}
                </span>
              </td>
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 text-gray-700">
                {route.totalDistance}
              </td>
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 text-gray-700">
                {route.avgTime}
              </td>
              <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${parseInt(route.efficiency) > 90 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                        parseInt(route.efficiency) > 80 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                          'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                      style={{
                        width: animationTrigger ? route.efficiency : '0%',
                        transitionDelay: `${idx * 150}ms`
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium">{route.efficiency}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={route.status as Status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${active
        ? "bg-white bg-opacity-90 text-blue-600 shadow-lg scale-105"
        : "text-gray-600 hover:bg-white hover:bg-opacity-50 hover:text-blue-500"
        }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Enhanced Animated Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0">
          {/* Primary pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              animation: 'float 8s ease-in-out infinite'
            }}
          />
          {/* Secondary pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.1'%3E%3Ccircle cx='60' cy='60' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              animation: 'float 12s ease-in-out infinite reverse'
            }}
          />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-teal-50/20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 p-6">
        {/* Enhanced Header Row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-md">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md border border-white/30 !mb-0">
                Today: {today}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md border border-white/30">
              <div className="p-1 bg-green-100 rounded-full">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">5 Active Loads</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 !text-white font-medium px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-green-400"
          >
            <Package className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            <span>New Load +</span>
          </button>

        </div>

        {/* Enhanced Dashboard Metrics */}
        {renderDashboardMetrics()}

        {/* Enhanced Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white/70 backdrop-blur-md p-2 rounded-xl shadow-lg border border-white/30">
          <TabButton
            id="loads"
            label="Active Loads"
            icon={Package}
            active={activeTab === 'loads'}
            onClick={setActiveTab}
          />
          <TabButton
            id="drivers"
            label="Today's Drivers"
            icon={Truck}
            active={activeTab === 'drivers'}
            onClick={setActiveTab}
          />
          <TabButton
            id="routes"
            label="Routes"
            icon={MapPin}
            active={activeTab === 'routes'}
            onClick={setActiveTab}
          />
        </div>

        {/* Content based on active tab */}
        <div className="transform transition-all duration-500 ease-out">
          {activeTab === 'loads' && renderLoadsTable()}
          {activeTab === 'drivers' && renderDriversTable()}
          {activeTab === 'routes' && renderRoutesTable()}
        </div>
      </div>

      {/* Enhanced Right Sidebar */}
      {/* Right Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full max-w-lg w-full sm:w-[42rem] bg-white bg-opacity-95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 border-opacity-50 ${sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <NewLoad onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-gray-900/50 backdrop-blur-sm transition-all duration-500"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Enhanced Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(1deg); }
          66% { transform: translateY(-4px) rotate(-1deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .group:hover .animate-pulse {
          animation: pulse 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Index;





