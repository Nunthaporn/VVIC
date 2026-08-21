import type { EChartsOption } from "echarts";
import type { Customer, CustomerFactory, Factory, FactoryProduct, Month } from "./types";

export const colors: Record<string, string> = { G1: "#f04486", G2: "#ffd126", G3: "#ff7917", G4: "#15b7c6", TRM: "#2889dc", EA: "#54df0b" };
const pct = (v: number | null) => v == null ? "N/A" : `${(v * 100).toFixed(1)}%`;
const fade = (selected: boolean, active: boolean) => !active || selected ? 1 : .2;
const productPalette = ["#1812a8", "#ffd91a", "#ff8b2c", "#16b9c7", "#2c8ce5", "#5bdc20", "#ef4b87", "#8a63d2", "#00a67d", "#d6692f"];
const productColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  return productPalette[Math.abs(hash) % productPalette.length];
};
const esc = (value: string) => value.replace(/[&<>"']/g, x => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[x]!));

export const lineOption = (
  d: Month[],
  selectedMonth: string | null
): EChartsOption => ({
  color: ["#20b4d4", "#2e5db2"],

  // ซ่อน VVIC / NON-VVIC ด้านขวาบน
  legend: {
    show: false
  },

  // Tooltip ตอนเอาเมาส์ชี้
  tooltip: {
    trigger: "axis",
    confine: true,

    axisPointer: {
      type: "line",
      lineStyle: {
        type: "dashed"
      }
    },

    formatter: (params: any) => {
      const rows = Array.isArray(params)
        ? params
        : [params];

      const month =
        rows[0]?.axisValueLabel ??
        rows[0]?.name ??
        "";

      const vvicRow = rows.find(
        (x: any) =>
          x.seriesName === "VVIC"
      );

      const nonVvicRow = rows.find(
        (x: any) =>
          x.seriesName === "NON-VVIC"
      );

      const vvic =
        vvicRow?.value != null
          ? pct(Number(vvicRow.value))
          : "N/A";

      const nonVvic =
        nonVvicRow?.value != null
          ? pct(Number(nonVvicRow.value))
          : "N/A";

      return `
        <div style="
          min-width:150px;
          padding:4px 2px;
          font-family:Inter, Segoe UI, sans-serif;
        ">

          <div style="
            font-weight:700;
            margin-bottom:10px;
            color:#273142;
          ">
            ${month}
          </div>

          <div style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:20px;
            margin-bottom:8px;
          ">
            <div style="
              display:flex;
              align-items:center;
              gap:7px;
            ">
              <span style="
                width:10px;
                height:10px;
                border-radius:50%;
                background:#20b4d4;
                display:inline-block;
              "></span>

              <span>VVIC</span>
            </div>

            <b>${vvic}</b>
          </div>

          <div style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:20px;
          ">
            <div style="
              display:flex;
              align-items:center;
              gap:7px;
            ">
              <span style="
                width:10px;
                height:10px;
                border-radius:50%;
                background:#2e5db2;
                display:inline-block;
              "></span>

              <span>NON-VVIC</span>
            </div>

            <b>${nonVvic}</b>
          </div>

        </div>
      `;
    }
  },

  grid: {
    left: 65,
    right: 25,
    top: 35,
    bottom: 82
  },

  xAxis: {
    type: "category",
    data: d.map(x => x.month),

    axisLabel: {
      rotate: 45
    }
  },

  yAxis: {
    type: "value",

    min: (x: any) =>
      Math.max(
        0,
        Math.floor(
          (x.min - 0.05) * 20
        ) / 20
      ),

    max: (x: any) =>
      Math.min(
        1,
        Math.ceil(
          (x.max + 0.05) * 20
        ) / 20
      ),

    axisLabel: {
      formatter: (v: number) =>
        `${Math.round(v * 100)}%`
    },

    splitLine: {
      lineStyle: {
        type: "dashed",
        color: "#d9e4f2"
      }
    }
  },

  dataZoom: [
    {
      type: "inside"
    },
    {
      type: "slider",
      height: 13,
      bottom: 8
    }
  ],

  series: [
    {
      name: "VVIC",
      type: "line",
      smooth: true,
      connectNulls: false,
      symbolSize: 10,

      lineStyle: {
        opacity:
          selectedMonth
            ? 0.28
            : 1
      },

      data: d.map(x => ({
        value: x.vvic,

        itemStyle: {
          opacity: fade(
            x.month === selectedMonth,
            !!selectedMonth
          )
        }
      })),

      label: {
        show: true,

        formatter: (x: any) =>
          pct(x.value),

        fontWeight: "bold",

        color: "#0586a7"
      }
    },

    {
      name: "NON-VVIC",
      type: "line",
      smooth: true,
      connectNulls: false,
      symbolSize: 9,

      lineStyle: {
        opacity:
          selectedMonth
            ? 0.28
            : 1
      },

      data: d.map(x => ({
        value: x.non_vvic,

        itemStyle: {
          opacity: fade(
            x.month === selectedMonth,
            !!selectedMonth
          )
        }
      })),

      label: {
        show: true,

        formatter: (x: any) =>
          pct(x.value),

        color: "#2e5db2"
      }
    }
  ]
});

export const factoryOption = (d: Factory[], products: FactoryProduct[], selected: { month: string; factory: string | null } | null): EChartsOption => {
  const months = [...new Set(d.map(x => x.month))]
    .sort()
    .slice(-4);

  const fs = Object.keys(colors);
  const rank = new Map<string, number>();
  months.forEach(month => d.filter(x => x.month === month && x.eff_pct != null).sort((a, b) => (a.eff_pct ?? 0) - (b.eff_pct ?? 0)).forEach((x, i) => rank.set(`${month}|${x.factory}`, i)));
  const series = fs.map(factory => ({
    name: factory,
    type: "custom",
    coordinateSystem: "cartesian2d",
    renderItem: (params: any, api: any) => {
      // ECharts can expose a category value as its numeric category index inside
      // renderItem. Use the source data order so selection always compares the
      // real YYYY-MM value with React state.
      const month = months[params.dataIndex], row = api.value(1), eff = api.value(2), nextRow = api.value(3);
      const point = api.coord([month, row]), band = api.size([1, 0])[0], width = band * .72, height = Math.min(25, Math.abs(api.size([0, 1])[1]) * .72);
      const x = point[0] - width / 2, y = point[1] - height / 2;
      const active = !selected || (month === selected.month && (!selected.factory || factory === selected.factory));
      const children: any[] = [];
      if (nextRow != null && params.dataIndex < months.length - 1) {
        const next = api.coord([months[params.dataIndex + 1], nextRow]);
        const x1 = x + width, x2 = next[0] - width / 2, y2 = next[1];
        children.push({ type: "path", shape: { pathData: `M${x1},${point[1] - height / 2} C${(x1 + x2) / 2},${point[1] - height / 2} ${(x1 + x2) / 2},${y2 - height / 2} ${x2},${y2 - height / 2} L${x2},${y2 + height / 2} C${(x1 + x2) / 2},${y2 + height / 2} ${(x1 + x2) / 2},${point[1] + height / 2} ${x1},${point[1] + height / 2} Z` }, style: { fill: colors[factory], opacity: selected ? (selected.factory && selected.factory !== factory ? .14 : .35) : .72 } });
      }
      children.push({ type: "rect", shape: { x, y, width, height, r: 2 }, style: { fill: colors[factory], opacity: active ? 1 : .2 } });
      children.push({ type: "text", style: { x: point[0], y: point[1], text: pct(eff), fill: "#07162e", font: "700 11px Inter, Segoe UI, sans-serif", textAlign: "center", textVerticalAlign: "middle", opacity: active ? 1 : .3 } });
      return { type: "group", children };
    },
    data: months.map((month, i) => {
      const item = d.find(x => x.month === month && x.factory === factory);
      const nextMonth = months[i + 1];
      return { name: month, value: [month, rank.get(`${month}|${factory}`) ?? null, item?.eff_pct ?? null, nextMonth ? rank.get(`${nextMonth}|${factory}`) ?? null : null] };
    }),
    encode: { x: 0, y: 1 },
  }));
  return { color: fs.map(x => colors[x]), tooltip: { trigger: "item", confine: true, backgroundColor: "#fff", borderColor: "#aeb8c6", borderWidth: 1, padding: 0, extraCssText: "box-shadow:0 8px 24px rgba(20,35,60,.22);border-radius:3px;", formatter: (x: any) => {
    const month = String(x?.value?.[0] ?? x?.name ?? ""), factory = String(x?.seriesName ?? "");
    const rows = products.filter(p => p.month === month && p.factory === factory && p.eff_pct != null).sort((a,b) => (b.eff_pct ?? 0) - (a.eff_pct ?? 0));
    const maximum = Math.max(...rows.map(r => r.eff_pct ?? 0), .01);
    const detail = rows.length ? rows.map(r => {
      const width = Math.max(5, ((r.eff_pct ?? 0) / maximum) * 205), color = productColor(r.product_type);
      return `<div style="margin-top:10px"><div style="font-size:10px;color:#283247;margin-bottom:4px">${esc(r.product_type)}</div><div style="display:flex;align-items:center;gap:9px"><span style="display:block;width:${width}px;max-width:205px;height:15px;border-radius:2px;background:${color}"></span><b style="font-size:11px;color:#172033">${pct(r.eff_pct)}</b></div></div>`;
    }).join("") : `<div style="margin-top:10px;color:#748196;font-size:11px">No Product Type data</div>`;
    return `<div style="padding:12px 14px;min-width:270px"><div style="font-size:12px;font-weight:700;color:#263145">EFF% by Product Type</div><div style="font-size:10px;color:#748196;margin-top:3px">${esc(factory)} · ${esc(month)}</div>${detail}</div>`;
  } }, legend: { top: 0, left: 0, itemWidth: 10, itemHeight: 10 }, grid: {
  left: 25,
  right: 18,
  top: 65,
  bottom: 35
  }, xAxis: { type: "category", data: months, boundaryGap: true, axisTick: { show: false }, axisLine: { show: false } }, yAxis: { type: "value", show: false, min: -.5, max: 5.5, interval: 1 }, series: series as any };
  };

export const customerOption = (d: Customer[], factoryRows: CustomerFactory[], target: number, selectedCustomer: string | null): EChartsOption => ({
  tooltip: { trigger: "item", confine: true, backgroundColor: "#fff", borderColor: "#aeb8c6", borderWidth: 1, padding: 0, extraCssText: "box-shadow:0 8px 24px rgba(20,35,60,.22);border-radius:3px;", formatter: (x: any) => {
    const brand = String(x?.name ?? ""), base = d[x.dataIndex];
    const rows = factoryRows.filter(r => r.customer === brand && r.eff_pct != null).sort((a,b) => (b.eff_pct ?? 0)-(a.eff_pct ?? 0));
    const bars = rows.map(r => `<div style="display:grid;grid-template-columns:34px 150px 42px;gap:8px;align-items:center;margin-top:9px"><span style="font-size:10px;color:#5f6878">${esc(r.factory)}</span><span style="height:28px;background:${colors[r.factory] ?? '#48bc67'};border-radius:2px"></span><b style="font-size:11px;color:#263145">${pct(r.eff_pct)}</b></div>`).join("");
    return `<div style="padding:12px 14px;min-width:270px"><div style="font-size:12px;font-weight:700;color:#263145">EFF% by FACTORY</div><div style="font-size:10px;color:#748196;margin-top:3px">${esc(brand)} · ${esc(base?.month ?? '')}</div>${bars || '<div style="margin-top:10px;color:#748196;font-size:11px">No Factory data</div>'}</div>`;
  } }, grid: { left: 175, right: 58, top: 28, bottom: 35 }, xAxis: { type: "value", min: 0, max: 1, axisLabel: { formatter: (v: number) => `${v * 100}%` }, splitLine: { lineStyle: { type: "dashed" } } }, yAxis: { type: "category", inverse: true, data: d.map(x => x.customer), axisTick: { show: false } }, dataZoom: d.length > 8 ? [{ type: "slider", yAxisIndex: 0, right: 3, width: 10 }] : [],
  series: [{ type: "bar", barWidth: 22, data: d.map(x => ({ value: x.eff_pct, itemStyle: { color: (x.eff_pct ?? 0) >= target ? "#23df7a" : "#df8396", borderRadius: [0, 5, 5, 0], opacity: fade(x.customer === selectedCustomer, !!selectedCustomer) } })), label: { show: true, position: "right", formatter: (x: any) => pct(x.value), fontWeight: "bold" }, markLine: { symbol: "none", lineStyle: { color: "#7ba4ec", type: "dashed", width: 2 }, label: { formatter: `Target: ${pct(target)}` }, data: [{ xAxis: target }] } }],
});
