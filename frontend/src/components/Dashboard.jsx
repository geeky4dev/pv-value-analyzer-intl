// Dashboard.jsx - International Version
// Financial Overview
//
// International version:
// - UI translated to English
// - Currency display changed from EUR to USD
// - Number formatting changed to en-US
// - Chart calculation logic unchanged
// - Internal data properties preserved

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

function Dashboard({ data }) {
  if (!data) return null;

  // ------------------------------------------------------------
  // USD formatting
  // ------------------------------------------------------------
  const formatUSD = (value) =>
    `$${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`;

  // ------------------------------------------------------------
  // Axis number formatting
  // ------------------------------------------------------------
  const formatAxis = (value) =>
    new Intl.NumberFormat("en-US").format(value);

  // ------------------------------------------------------------
  // Cashflow data
  // ------------------------------------------------------------
  const cashflows = Array.isArray(data.cashflows)
    ? data.cashflows
    : [];

  const cashflowData = cashflows.map((value, index) => ({
    year: index,
    value,
  }));

  // ------------------------------------------------------------
  // Cumulative cashflow
  // Financial calculation unchanged
  // ------------------------------------------------------------
  const cumulative = [];

  cashflows.reduce((acc, val, i) => {
    acc += val;

    cumulative.push({
      year: i,
      value: acc,
    });

    return acc;
  }, 0);

  // ------------------------------------------------------------
  // X-axis years
  // ------------------------------------------------------------
  const years = cashflowData.map((d) => d.year);

  const maxYear = years.length
    ? Math.max(...years)
    : 0;

  const xTicks = Array.from(
    { length: maxYear + 1 },
    (_, i) => i
  );

  return (
    <div className="card p-4 mt-4 w-100 overflow-hidden">

      {/* ========================================================
          FINANCIAL OVERVIEW
      ======================================================== */}
      <h4>📊 Financial Overview</h4>

      <div className="row text-center mb-4">

        {/* NPV */}
        <div className="col">
          <h6>NPV</h6>

          <h4 className="text-success">
            {formatUSD(data.npv)}
          </h4>
        </div>

        {/* IRR */}
        <div className="col">
          <h6>IRR</h6>

          <h4 className="text-primary">
            {typeof data.irr === "string"
              ? data.irr
              : data.irr}{" "}
            %
          </h4>
        </div>

      </div>

      {/* ========================================================
          ANNUAL CASH FLOW
      ======================================================== */}
      <h6>Annual Cash Flow</h6>

      <div
        style={{
          width: "100%",
          height: 300,
        }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={cashflowData}
            margin={{
              top: 20,
              right: 20,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="year"
              type="number"
              domain={[0, maxYear]}
              ticks={xTicks}
              tickMargin={10}
              allowDuplicatedCategory={false}
            />

            <YAxis
              tickFormatter={formatAxis}
              width={70}
            />

            <Tooltip
              formatter={(value) => [
                formatUSD(value),
                "Value",
              ]}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ========================================================
          CUMULATIVE CASH FLOW
      ======================================================== */}
      <h6 className="mt-4">
        Cumulative Cash Flow
      </h6>

      <div
        style={{
          width: "100%",
          height: 300,
        }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={cumulative}
            margin={{
              top: 20,
              right: 20,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="year"
              type="number"
              domain={[0, maxYear]}
              ticks={xTicks}
              tickMargin={10}
              allowDuplicatedCategory={false}
            />

            <YAxis
              tickFormatter={formatAxis}
              width={70}
            />

            <Tooltip
              formatter={(value) => [
                formatUSD(value),
                "Cumulative",
              ]}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#82ca9d"
              dot={{ r: 3 }}
            />

            {/* --------------------------------------------------
                Payback reference line
                Calculation unchanged
            -------------------------------------------------- */}
            {data.payback !== undefined &&
              data.payback !== null && (
                <ReferenceLine
                  x={Number(data.payback)}
                  stroke="red"
                  label={{
                    position: "top",
                    value: "Payback",
                    fill: "red",
                    fontSize: 12,
                  }}
                />
              )}

          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

export default Dashboard;