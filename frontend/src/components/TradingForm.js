import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';
import { Badge } from './ui/badge.jsx';
import { Slider } from './ui/slider.jsx';
import { Switch } from './ui/switch.jsx';
import { Separator } from './ui/separator.jsx';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { formatCurrency, formatNumber } from '../lib/utils';

// Validation schema
const tradingFormSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['buy', 'sell'], {
    required_error: 'Please select buy or sell',
  }),
  orderType: z.enum(['market', 'limit', 'stop'], {
    required_error: 'Please select order type',
  }),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  price: z.number().optional(),
  stopPrice: z.number().optional(),
  leverage: z.number().min(1).max(100).optional(),
  reduceOnly: z.boolean().optional(),
  postOnly: z.boolean().optional(),
});

const TradingForm = ({ 
  onSubmit, 
  balance = 10000, 
  currentPrice = 44250,
  symbol = 'BTC/USD',
  className = '' 
}) => {
  const [riskLevel, setRiskLevel] = useState([2]);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const form = useForm({
    resolver: zodResolver(tradingFormSchema),
    defaultValues: {
      symbol: symbol,
      side: 'buy',
      orderType: 'market',
      quantity: 0,
      price: currentPrice,
      stopPrice: 0,
      leverage: 1,
      reduceOnly: false,
      postOnly: false,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watchedValues = watch();

  const calculateOrderValue = () => {
    const quantity = parseFloat(watchedValues.quantity) || 0;
    const price = watchedValues.orderType === 'market' ? currentPrice : (parseFloat(watchedValues.price) || currentPrice);
    return quantity * price;
  };

  const calculateMaxQuantity = () => {
    const price = watchedValues.orderType === 'market' ? currentPrice : (parseFloat(watchedValues.price) || currentPrice);
    const leverage = parseFloat(watchedValues.leverage) || 1;
    return (balance * leverage) / price;
  };

  const handleRiskChange = (value) => {
    setRiskLevel(value);
    const riskPercentage = value[0];
    const maxQuantity = calculateMaxQuantity();
    const riskQuantity = (maxQuantity * riskPercentage) / 100;
    setValue('quantity', riskQuantity);
  };

  const handlePercentageClick = (percentage) => {
    const maxQuantity = calculateMaxQuantity();
    const quantity = (maxQuantity * percentage) / 100;
    setValue('quantity', quantity);
  };

  const onFormSubmit = (data) => {
    console.log('Form submitted:', data);
    onSubmit?.(data);
  };

  const orderValue = calculateOrderValue();
  const maxQuantity = calculateMaxQuantity();
  const isBuy = watchedValues.side === 'buy';

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Place Order</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Balance: {formatCurrency(balance)}
            </Badge>
            <Badge variant="outline">
              {symbol}: {formatCurrency(currentPrice)}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Order Type Tabs */}
          <Tabs 
            value={watchedValues.orderType} 
            onValueChange={(value) => setValue('orderType', value)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="limit">Limit</TabsTrigger>
              <TabsTrigger value="stop">Stop</TabsTrigger>
            </TabsList>

            {/* Symbol and Side */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Select value={watchedValues.symbol} onValueChange={(value) => setValue('symbol', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select symbol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                    <SelectItem value="ETH/USD">ETH/USD</SelectItem>
                    <SelectItem value="SOL/USD">SOL/USD</SelectItem>
                    <SelectItem value="ADA/USD">ADA/USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="side">Side</Label>
                <Select value={watchedValues.side} onValueChange={(value) => setValue('side', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-success-500" />
                        <span>Buy</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sell">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-4 h-4 text-danger-500" />
                        <span>Sell</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order Type Content */}
            <TabsContent value="market" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="relative">
                  <Input
                    id="quantity"
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    {...register('quantity', { valueAsNumber: true })}
                    className="pr-16"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    {symbol.split('/')[0]}
                  </div>
                </div>
                {errors.quantity && (
                  <p className="text-sm text-danger-500">{errors.quantity.message}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="limit" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('price', { valueAsNumber: true })}
                    className="pr-16"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    USD
                  </div>
                </div>
                {errors.price && (
                  <p className="text-sm text-danger-500">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="relative">
                  <Input
                    id="quantity"
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    {...register('quantity', { valueAsNumber: true })}
                    className="pr-16"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    {symbol.split('/')[0]}
                  </div>
                </div>
                {errors.quantity && (
                  <p className="text-sm text-danger-500">{errors.quantity.message}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stop" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stopPrice">Stop Price</Label>
                <div className="relative">
                  <Input
                    id="stopPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('stopPrice', { valueAsNumber: true })}
                    className="pr-16"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    USD
                  </div>
                </div>
                {errors.stopPrice && (
                  <p className="text-sm text-danger-500">{errors.stopPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="relative">
                  <Input
                    id="quantity"
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    {...register('quantity', { valueAsNumber: true })}
                    className="pr-16"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    {symbol.split('/')[0]}
                  </div>
                </div>
                {errors.quantity && (
                  <p className="text-sm text-danger-500">{errors.quantity.message}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Percentage Buttons */}
          <div className="space-y-2">
            <Label>Quick Amount</Label>
            <div className="flex space-x-2">
              {[25, 50, 75, 100].map((percentage) => (
                <Button
                  key={percentage}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageClick(percentage)}
                  className="flex-1"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </div>

          {/* Risk Slider */}
          <div className="space-y-2">
            <Label>Risk Level: {riskLevel[0]}%</Label>
            <Slider
              value={riskLevel}
              onValueChange={handleRiskChange}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={isAdvanced}
                onCheckedChange={setIsAdvanced}
                id="advanced"
              />
              <Label htmlFor="advanced">Advanced Options</Label>
            </div>

            {isAdvanced && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="leverage">Leverage: {watchedValues.leverage}x</Label>
                  <Slider
                    value={[watchedValues.leverage]}
                    onValueChange={(value) => setValue('leverage', value[0])}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      {...register('reduceOnly')}
                      id="reduceOnly"
                    />
                    <Label htmlFor="reduceOnly">Reduce Only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      {...register('postOnly')}
                      id="postOnly"
                    />
                    <Label htmlFor="postOnly">Post Only</Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-3">
            <h4 className="font-medium">Order Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span>{formatNumber(watchedValues.quantity || 0, 4)} {symbol.split('/')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span>{formatCurrency(watchedValues.orderType === 'market' ? currentPrice : watchedValues.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{formatCurrency(orderValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Quantity:</span>
                <span>{formatNumber(maxQuantity, 4)} {symbol.split('/')[0]}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className={`w-full ${
              isBuy 
                ? 'bg-success-500 hover:bg-success-600' 
                : 'bg-danger-500 hover:bg-danger-600'
            }`}
            size="lg"
          >
            {isBuy ? (
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Buy {symbol.split('/')[0]}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5" />
                <span>Sell {symbol.split('/')[0]}</span>
              </div>
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default TradingForm;