import { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import { BarChart3, RefreshCcw } from "lucide-react";

import { getJSON } from "./api";
import {
  customerOption,
  factoryOption,
  lineOption,
} from "./charts";

import type {
  Customer,
  CustomerFactory,
  Factory,
  FactoryProduct,
  Filters,
  Month,
  Summary,
} from "./types";


const factories = [
  "G1",
  "G2",
  "G3",
  "G4",
  "TRM",
  "EA",
];


const fmt = (
  x: number | null | undefined
) =>
  x == null
    ? "N/A"
    : `${(x * 100).toFixed(2)}%`;


type Cross = {
  month: string | null;
  factory: string | null;
  customer: string | null;
};


function App() {

  // =========================================================
  // DEFAULT FILTER
  // =========================================================

  const defaults: Filters = {
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    customer_type: "VVIC",
    factory: [],
    customer: null,
  };


  // =========================================================
  // STATE
  // =========================================================

  const [f, setF] =
    useState<Filters>(defaults);

  const [cross, setCross] =
    useState<Cross>({
      month: null,
      factory: null,
      customer: null,
    });


  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [monthly, setMonthly] =
    useState<Month[]>([]);

  const [factory, setFactory] =
    useState<Factory[]>([]);

  const [
    factoryProducts,
    setFactoryProducts,
  ] = useState<FactoryProduct[]>([]);

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [
    customerFactories,
    setCustomerFactories,
  ] = useState<CustomerFactory[]>([]);


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refresh, setRefresh] =
    useState(0);


  const abort =
    useRef<AbortController | undefined>(
      undefined
    );


  const target = 0.60;


  // =========================================================
  // EFFECTIVE FILTER
  //
  // ใช้กับ KPI และ visual ที่ต้อง cross-filter
  // =========================================================

  const effective =
    useMemo<Filters>(() => {

      const next: Filters = {
        ...f,

        factory:
          cross.factory
            ? [cross.factory]
            : f.factory,

        customer:
          cross.customer ??
          f.customer,
      };


      // ถ้ามีการคลิกเดือน
      if (cross.month) {

        const [y, m] =
          cross.month
            .split("-")
            .map(Number);


        next.start_date =
          `${y}-${String(m).padStart(
            2,
            "0"
          )}-01`;


        // วันสุดท้ายของเดือน
        next.end_date =
          new Date(
            Date.UTC(y, m, 0)
          )
            .toISOString()
            .slice(0, 10);
      }


      return next;

    }, [f, cross]);


  // =========================================================
  // PERFORMANCE TREND FILTER
  //
  // สำคัญ:
  // กราฟ VVIC vs NON-VVIC
  // ต้องดึงทั้งสองประเภทเสมอ
  //
  // ถึงด้านบนเลือก VVIC / NON-VVIC
  // กราฟนี้ยังแสดง comparison 2 ค่า
  // =========================================================

  const trendFilters =
    useMemo<Filters>(() => {

      const next: Filters = {
        ...f,

        // สำคัญ
        // Performance Trend ต้องดึง
        // VVIC + NON-VVIC
        customer_type: "ALL",

        // ถ้าคลิก Factory chart
        // ให้เลือก factory นั้น
        factory:
          cross.factory
            ? [cross.factory]
            : f.factory,

        customer: null,
      };


      // ถ้าคลิกเดือน
      // ให้ Trend เหลือเดือนนั้น
      if (cross.month) {

        const [y, m] =
          cross.month
            .split("-")
            .map(Number);


        next.start_date =
          `${y}-${String(m).padStart(
            2,
            "0"
          )}-01`;


        next.end_date =
          new Date(
            Date.UTC(y, m, 0)
          )
            .toISOString()
            .slice(0, 10);
      }


      return next;

    }, [
      f,
      cross.month,
      cross.factory,
    ]);


  // =========================================================
  // CUSTOMER FILTER
  // =========================================================

  const customerFilters =
    useMemo<Filters>(() => {

      // ตอนเลือก customer
      // ไม่ต้องกรองกราฟ customer
      // จนเหลือ customer เดียว
      if (cross.customer) {
        return f;
      }

      return effective;

    }, [
      f,
      effective,
      cross.customer,
    ]);


  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {

    // ยกเลิก request เก่า
    abort.current?.abort();


    const c =
      new AbortController();


    abort.current = c;


    setLoading(true);
    setError("");


    Promise.all([

      // -----------------------------------------------------
      // KPI
      // YTD / QTD / MTD
      // -----------------------------------------------------

      getJSON<Summary>(
        "/api/dashboard/summary",
        effective,
        c.signal
      ),


      // -----------------------------------------------------
      // PERFORMANCE TREND
      //
      // ใช้ trendFilters
      // เพื่อให้ดึง VVIC + NON-VVIC เสมอ
      // -----------------------------------------------------

      getJSON<Month[]>(
        "/api/dashboard/monthly-comparison",
        trendFilters,
        c.signal
      ),


      // -----------------------------------------------------
      // FACTORY MONTHLY
      // -----------------------------------------------------

      getJSON<Factory[]>(
        "/api/dashboard/factory-monthly",
        f,
        c.signal
      ),


      // -----------------------------------------------------
      // FACTORY PRODUCT BREAKDOWN
      // -----------------------------------------------------

      getJSON<FactoryProduct[]>(
        "/api/dashboard/factory-product-breakdown",
        f,
        c.signal
      ),


      // -----------------------------------------------------
      // CUSTOMER MTD
      // -----------------------------------------------------

      getJSON<Customer[]>(
        "/api/dashboard/customer-mtd",
        customerFilters,
        c.signal,
        {
          target: String(target),
        }
      ),


      // -----------------------------------------------------
      // CUSTOMER FACTORY MTD
      // -----------------------------------------------------

      getJSON<CustomerFactory[]>(
        "/api/dashboard/customer-factory-mtd",
        customerFilters,
        c.signal
      ),

    ])

      .then(
        ([
          s,
          m,
          fa,
          fp,
          cu,
          cf,
        ]) => {

          setSummary(s);

          setMonthly(m);

          setFactory(fa);

          setFactoryProducts(fp);

          setCustomers(cu);

          setCustomerFactories(cf);

        }
      )

      .catch(e => {

        if (
          e.name !==
          "AbortError"
        ) {
          setError(
            e.message
          );
        }

      })

      .finally(() => {

        if (
          !c.signal.aborted
        ) {
          setLoading(
            false
          );
        }

      });


    return () => {
      c.abort();
    };

  }, [
    f,
    effective,
    trendFilters,
    customerFilters,
    refresh,
  ]);


  // =========================================================
  // SELECT FACTORY BUTTON
  // =========================================================

  const selectFactory =
    (x: string) => {

      // ล้าง cross filter
      setCross({
        month: null,
        factory: null,
        customer: null,
      });


      setF(v => ({
        ...v,

        factory:
          x === "ALL"
            ? []
            : [x],
      }));

    };


  // =========================================================
  // CLICK PERFORMANCE TREND MONTH
  // =========================================================

  const toggleMonth =
    (month: string) => {

      setCross(v =>

        v.month === month

          ? {
              month: null,
              factory: null,
              customer: null,
            }

          : {
              month,
              factory: null,
              customer: null,
            }
      );

    };


  // =========================================================
  // CLICK FACTORY CHART
  //
  // เช่น:
  // month   = 2025-10
  // factory = G2
  //
  // Performance Trend จะเหลือ
  // Oct 2025 + G2
  // และแสดง VVIC + NON-VVIC
  // =========================================================

  const toggleFactoryPoint =
    (
      month: string,
      name: string
    ) => {

      setCross(v =>

        v.month === month &&
        v.factory === name

          ? {
              month: null,
              factory: null,
              customer: null,
            }

          : {
              month,
              factory: name,
              customer: null,
            }
      );

    };


  // =========================================================
  // CLICK CUSTOMER
  // =========================================================

  const toggleCustomer =
    (name: string) => {

      setCross(v =>

        v.customer === name

          ? {
              month: null,
              factory: null,
              customer: null,
            }

          : {
              month: null,
              factory: null,
              customer: name,
            }
      );

    };


  // =========================================================
  // FILTER LABEL
  // =========================================================

  const filterLabel =
    // `${f.customer_type}` +

    // ` · ${f.factory[0] ||
    //   "ALL FACTORIES"}` +

    (
      cross.month
        ? ` · ${cross.month}`
        : ""
    ) +

    (
      cross.factory
        ? ` · ${cross.factory}`
        : ""
    ) +

    (
      cross.customer
        ? ` · ${cross.customer}`
        : ""
    );


  // =========================================================
  // UI
  // =========================================================

  return (

    <div
      className="
        min-h-screen
        bg-[#eaf1f8]
        text-ink
      "
    >

      <main
        className="dashboard-main"
      >


        {/* =================================================
            HEADER
        ================================================= */}

        <header>

          <div>

            {/* <span
              className="eyebrow"
            >
              OPERATIONS INTELLIGENCE
            </span> */}

            <h1>
              VVIC CUSTOMER
            </h1>

          </div>


          {/* CUSTOMER TYPE */}

          <label>

            CUSTOMER TYPE

            <select
              value={
                f.customer_type
              }

              onChange={e => {

                // ล้าง cross filter
                setCross({
                  month: null,
                  factory: null,
                  customer: null,
                });


                setF(v => ({
                  ...v,

                  customer_type:
                    e.target.value,
                }));

              }}
            >

              <option
                value="VVIC"
              >
                VVIC
              </option>

              <option
                value="NON-VVIC"
              >
                NON-VVIC
              </option>

            </select>

          </label>


          {/* START DATE */}

          <label>
            START DATE

            <input
              type="date"
              value={f.start_date}
              onChange={e => {
                const value = e.target.value;

                // ล้าง selection จากการคลิกกราฟ
                // เพื่อให้ Date Filter เป็นตัวหลัก
                setCross({
                  month: null,
                  factory: null,
                  customer: null,
                });

                setF(v => ({
                  ...v,
                  start_date: value,
                }));
              }}
            />
          </label>


          {/* END DATE */}

          <label>
            END DATE

            <input
              type="date"
              value={f.end_date}
              onChange={e => {
                const value = e.target.value;

                // ล้าง selection เดิมจากกราฟ
                setCross({
                  month: null,
                  factory: null,
                  customer: null,
                });

                setF(v => ({
                  ...v,
                  end_date: value,
                }));
              }}
            />
          </label>


          {/* FACTORY BUTTONS */}

          <div
            className="factories"
          >

            <button
              className={
                !f.factory.length
                  ? "sel"
                  : ""
              }

              onClick={() =>
                selectFactory(
                  "ALL"
                )
              }
            >
              ALL
            </button>


            {factories.map(
              x => (

                <button
                  key={x}

                  className={
                    f.factory[0] === x
                      ? "sel"
                      : ""
                  }

                  onClick={() =>
                    selectFactory(
                      x
                    )
                  }
                >
                  {x}
                </button>

              )
            )}

          </div>


          {/* REFRESH */}

          <button
            className="refresh-data"

            onClick={() =>
              setRefresh(
                x => x + 1
              )
            }
          >
            <RefreshCcw
              size={16}
            />
          </button>

        </header>


        {/* =================================================
            STATUS
        ================================================= */}

        <div
          className="status"
        >

          <span
            className="dot"
          />

          {/* DATA AS OF */}

          {/* <b>
            {
              summary?.data_as_of
              ?? "N/A"
            }
          </b> */}


          <i />


          {filterLabel}


          {
            (
              cross.month ||
              cross.factory ||
              cross.customer
            ) && (

              <button
                className="clear-filter"

                onClick={() =>
                  setCross({
                    month: null,
                    factory: null,
                    customer: null,
                  })
                }
              >
                CLEAR SELECTION
              </button>

            )
          }


          <span
            className="refresh-time"
          >

            REFRESH:{" "}

            {
              summary

                ? new Date(
                    summary.last_refresh
                  ).toLocaleString(
                    "th-TH"
                  )

                : "—"
            }

          </span>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {
          error && (

            <div
              className="error"
            >

              <b>
                {error}
              </b>

              <button
                onClick={() =>
                  setRefresh(
                    x => x + 1
                  )
                }
              >
                ลองใหม่
              </button>

            </div>

          )
        }


        {/* =================================================
            DASHBOARD GRID
        ================================================= */}

        <section
          className="grid-layout"
        >


          {/* =================================================
              LEFT
          ================================================= */}

          <div
            className="left"
          >


            {/* KPI */}

            <div
              className="kpis"
            >

              {
                [
                  [
                    "YTD EFF%",
                    summary?.ytd_eff_pct,
                  ],

                  [
                    "QTD EFF%",
                    summary?.qtd_eff_pct,
                  ],

                  [
                    "MTD EFF%",
                    summary?.mtd_eff_pct,
                  ],

                ].map(
                  ([name, val]) => (

                    <article
                      className="kpi"

                      key={
                        name as string
                      }
                    >

                      <em />

                      <span>
                        {
                          name as string
                        }
                      </span>

                      <b>

                        {
                          loading

                            ? (
                              <span
                                className="
                                  skeleton
                                  wide
                                "
                              />
                            )

                            : fmt(
                                val as
                                  | number
                                  | null
                              )
                        }

                      </b>

                    </article>

                  )
                )
              }

            </div>


            {/* =================================================
                PERFORMANCE TREND
            ================================================= */}

            <article
              className="
                card
                trend
                clickable
              "
            >

              <div
                className="card-title"
              >

                <div>

                  <span>
                    PERFORMANCE TREND
                  </span>

                  <h2>
                    EFF% by Month —
                    VVIC vs Non-VVIC
                  </h2>

                </div>

              </div>


              {
                loading

                  ? (
                    <div
                      className="
                        skeleton
                        chart
                      "
                    />
                  )

                  : (
                    <ReactECharts

                      option={
                        lineOption(
                          monthly,
                          cross.month
                        )
                      }

                      onEvents={{

                        click:
                          (p: any) => {

                            if (
                              p?.name
                            ) {

                              toggleMonth(
                                String(
                                  p.name
                                )
                              );

                            }

                          }

                      }}

                      style={{
                        height: 420,
                      }}

                    />
                  )
              }

            </article>

          </div>


          {/* =================================================
              RIGHT
          ================================================= */}

          <div
            className="right"
          >


            {/* =================================================
                FACTORY CHART
            ================================================= */}

            <article
              className="
                card
                factory-card
                clickable
              "
            >

              <div
                className="card-title"
              >

                <div>

                  <span>
                    FACTORY VIEW
                  </span>

                  <h2>
                    Monthly EFF% by
                    FACTORY and by VVIC
                  </h2>

                </div>

              </div>


              {
                loading

                  ? (
                    <div
                      className="
                        skeleton
                        chart
                      "
                    />
                  )

                  : (
                    <ReactECharts

                      option={
                        factoryOption(
                          factory,
                          factoryProducts,

                          cross.month
                            ? {
                                month:
                                  cross.month,

                                factory:
                                  cross.factory,
                              }

                            : null
                        )
                      }

                      onEvents={{

                        click:
                          (p: any) => {

                            const month =
                              p?.value?.[0]
                              ?? p?.name;


                            const factoryName =
                              p?.seriesName;


                            if (
                              month &&
                              factoryName
                            ) {

                              toggleFactoryPoint(

                                String(
                                  month
                                ),

                                String(
                                  factoryName
                                )

                              );

                            }

                          }

                      }}

                      style={{
                        height: 265,
                      }}

                    />
                  )
              }

            </article>


            {/* =================================================
                CUSTOMER MTD
            ================================================= */}

            <article
              className="
                card
                customer-card
                clickable
              "
            >

              <div
                className="card-title"
              >

                <div>

                  <span>
                    BRAND RANKING
                  </span>

                  <h2>
                    MTD EFF% by VVIC
                  </h2>

                </div>


                <mark>
                  Target 60%
                </mark>

              </div>


              {
                !loading &&
                !customers.length

                  ? (
                    <div
                      className="empty"
                    >

                      <BarChart3 />

                      ไม่พบข้อมูลในช่วงที่เลือก

                    </div>
                  )

                  : loading

                    ? (
                      <div
                        className="
                          skeleton
                          chart
                        "
                      />
                    )

                    : (
                      <div
                        style={{
                          height: 360,
                          overflowY: "auto",
                          overflowX: "hidden",
                          paddingRight: 4,
                        }}
                      >
                        <ReactECharts

                          option={
                            customerOption(
                              customers,
                              customerFactories,
                              target,
                              cross.customer
                            )
                          }

                          onEvents={{

                            click:
                              (p: any) => {

                                if (
                                  p?.name
                                ) {

                                  toggleCustomer(
                                    String(
                                      p.name
                                    )
                                  );

                                }

                              }

                          }}

                          style={{
                            height: Math.max(
                              360,
                              customers.length * 44
                            ),
                            width: "100%",
                          }}

                        />
                      </div>
                    )
              }

            </article>

          </div>

        </section>

      </main>

    </div>
  );
}


export default App;