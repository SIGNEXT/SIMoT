from plotly.subplots import make_subplots
from config import *
import plotly.graph_objects as go
import os

PLOT_HEIGHT = 185
PLOT_WIDTH = 1000
PLOT_FONT = dict( family="Times New Roman", size=16)
PLOT_TITLE_FONT = dict( family="Times New Roman", size=5)

def create_heatmap(fig, metric_df, x, df_device_cols, col_labels, plot_idx, dx, hide_annotations):
    z = []
    for device in df_device_cols:
        if device in metric_df.columns:
            z.append(metric_df[device].fillna(0).astype('Int64'))


    fig.add_trace(
        go.Heatmap(
            z=z,
            x0=x[0],
            dx=dx,
            y=col_labels,
            xgap=1,
            ygap=1,
            text=z,
            colorscale=[[0, "rgb(255,255,255)"], [1, "rgb(140, 149, 255)"]],
            # yaxis="y{}".format(plot_idx + 1),
            showscale=False,
        ),
        row=plot_idx + 1,
        col=1,
    )
    if hide_annotations:
        return

    for n, row in enumerate(z):
        for m, val in enumerate(row):
            # if val > 0:
            fig.add_annotation(
                dict(
                    text=str(val),
                    x=x[m],
                    y=col_labels[n],
                    xref="x",
                    yref="y{}".format(plot_idx + 1),
                    showarrow=False,
                )
            )

def create_scatter(fig, metric_df, df_device_cols, plot_idx):
    colors = ["#636efa", "#ef553b", "#00cc96", "#ab63fa", "#ffa15a"]

    for idx, device in enumerate(df_device_cols):
        if device in metric_df.columns:
            fig.add_trace(
                go.Scatter(
                    x=[t for t in metric_df["t"].tolist()],
                    y=metric_df[device],
                    yaxis="y{}".format(plot_idx + 1),
                    mode="lines+markers",
                    name="Dev. {}".format(idx + 1),
                    line=dict(width=2, color=colors[idx]),
                    connectgaps=True,
                    showlegend=True if plot_idx == 0 else False,
                ),
                row=plot_idx + 1,
                col=1,
            )

def create_scatter_update(fig, metric_df, df_device_cols, plot_idx):
    metric_df = metric_df.replace(1, 'AC-ON')
    metric_df = metric_df.replace(2, 'AC-OFF')
    metric_df = metric_df.replace(3, 'DEHUM')
    colors = ['#B6E880', '#FF97FF', '#FECB52']
    for idx, device in enumerate(df_device_cols):
        if device in metric_df.columns:
            tempdf = metric_df[~metric_df[device].isna()]
            fig.add_trace(
                go.Scatter(
                    x=[t for t in tempdf["t"].tolist()],
                    y=tempdf[device],
                    # yaxis="y{}".format(plot_idx + 1),
                    mode="markers",
                    # name="Dev. {}".format(idx + 1),
                    # line=dict(width=2, color='#999999'),
                    # connectgaps=False,
                    marker=dict(color=colors[idx]),
                    showlegend=True if plot_idx == 0 else False,
                ),
                row=plot_idx + 1,
                col=1,
            )
def create_graphs(
    exp_name,
    timestamp,
    devices,
    metrics,
    dx,
    ranges_min,
    ranges_max
  ):
    x = [t - 1 for t in list(metrics.values())[-2]["t"].tolist()]
    x.append(x[-1] + dx)
    col_labels = [f"Dev. {devices[i]}" if devices[i] != "0" else "Listener" for i in range(len(devices))]
    subplot_titles = [config_metrics[k]['plot_title'] for k in metrics.keys()]
    subplot_types = [[{"type": v['plot_type']}] for k,v in config_metrics.items() if k in metrics]
    fig = make_subplots(
        rows=len(metrics),
        cols=1,
        shared_xaxes=True,
        vertical_spacing=0.1,
        row_heights=[int(PLOT_HEIGHT/len(metrics))]*len(metrics),
        x_title="Time (s)",
        subplot_titles=subplot_titles,
        specs=subplot_types,
    )

    for plot_idx, metric in enumerate(metrics):
        metric_df = metrics[metric]
        # if config_metrics[metric]['plot_type'] == 'heatmap' and metric in ['inauction']:
        #     create_heatmap_boolean(fig, metric_df, x, devices, col_labels, plot_idx, dx)
        if metric == 'update':
            create_scatter_update(fig, metric_df, ['0', '-1', '-2'], plot_idx)
        elif config_metrics[metric]['plot_type'] == 'heatmap':
            create_heatmap(fig, metric_df, x, devices if metric != 'update' else ['0'], col_labels if metric != 'update' else ['Listener'], plot_idx, dx, metric in ['inauction', 'update'])
        else:
            create_scatter(fig, metric_df, devices, plot_idx)


    shapes = []
    for g in range(1, len(ranges_min) + 1):
        for idx, t in enumerate(x):
            shapes.append(
                dict(
                    type="line",
                    xref="x",
                    yref="y%s" % g,
                    x0=t,
                    y0=ranges_min[g - 1],
                    x1=t,
                    y1=ranges_max[g - 1],
                    line=dict(color="dimgrey", width=0.1),
                )
            )
    # Add figure title
    fig.update_layout(
        xaxis=dict(dtick=5),
        font=PLOT_FONT,
        height=PLOT_HEIGHT * len(metrics),
        width=PLOT_WIDTH,
        margin=dict(t=45, b=20, l=0, r=0),
        legend=dict(orientation="h", x=0.5, y=-0.10, xanchor="center", yanchor="top"),
        shapes = shapes,
        plot_bgcolor="rgba(0,0,0,0)",
        title=exp_name
    )
    fig.update_xaxes(range=[x[0] - 5, x[-1] + 5])
    fig.show()
    fig.write_image(f"{os.path.dirname(__file__)}/results/{timestamp}-{exp_name}/{exp_name}.pdf")
    fig.write_image(f"{os.path.dirname(__file__)}/results/{timestamp}-{exp_name}/{exp_name}.pdf")

