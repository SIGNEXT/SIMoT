config_exps = {
  'TrivialNoFail': { 
    'measurements': '',
    'metrics': ["uptime", "nodes"],
    'args': {}
  },
  'RecFailMax': { 
    'measurements': 'cbba_rec_fail_final-v5-2022-06-07T20:10:27.975Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 100,
      'dx': 10
    }
  },
  'RecFailStab': { 
    'measurements': 'cbba_rec_fail_final-v5-2022-06-07T20:15:55.086Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 100,
      'dx': 10
    }
  },
  'NodeErrorMax': { 
    'measurements': 'cbba-device-node-error-3-v5-2022-06-07T19:01:03.351Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 300,
      'end_time': 600,
      'dx': 10
    }
  },
  'NodeErrorStab': { 
    'measurements': 'cbba-device-node-error-3-v5-2022-06-07T18:44:02.950Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 300,
      'end_time': 600,
      'dx': 10
    }
  },
  'SC1': { 
    'measurements': 'sc1-20-18-02-49',
    'metrics': ["usedflash", "usedram", "uptime", "nodes", "inauction", "update"],
    'args': {
      'start_time': 0,
      'end_time': None,
      'dx': 10
    }
  },
  'SC2': { 
    'measurements': 'sc2-20-18-53-26',
    'metrics': ["usedflash", "usedram", "uptime", "nodes", "inauction", "update"],
    'args': {
      'start_time': 0,
      'end_time': None,
      'dx': 10
    }
  },
  'SC3': { 
    'measurements': 'sc3-20-19-08-31',
    'metrics': ["usedflash", "usedram", "uptime", "nodes", "inauction", "update"],
    'args': {
      'start_time': 0,
      'end_time': None,
      'dx': 10
    }
  },
  'SC4': { 
    'measurements': 'sc4-20-20-21-07',
    'metrics': ["usedflash", "usedram", "uptime", "nodes", "inauction", "update"],
    'args': {
      'start_time': 0,
      'end_time': None,
      'dx': 10
    }
  },
  'SC5': { 
    'measurements': 'sc5-21-10-46-49',
    'metrics': ["usedram", "uptime", "nodes", "inauction"],
    'args': {
      'start_time': 0,
      'end_time': None,
      'dx': 10
    }
  },
  'SC8A': { 
    'measurements': 'sc8a-22-14-44-11',
    'metrics': ["uptime", "nodes", "inauction"],
    'args': {
      'start_time': 0,
      'end_time': None,
      'dx': 20
    }
  },
  'SC8B': { 
    'measurements': 'sc8b-cbba_showcase-v5-2022-06-21T21:32:49.323Z',
    'metrics': ["payload", "uptime", "nodes", "inauction"],
    'args': {
      'start_time': 0,
      'end_time': 220,
      'dx': 10
    }
  },
  'SC12A': {
    'measurements': 'sc12a-cbba_rec_fail_final-v5-2022-06-23T17:57:31.479Z',
    'metrics': ["payload", "uptime", "nodes", "inauction"],
    'args': {
      'start_time': 0,
      'end_time': 150,
      'dx': 10
    }
  },
  'SC12B': {
    'measurements': 'sc12b-cbba_rec_fail_final-v5-2022-06-23T18:07:17.456Z',
    'metrics': ["payload", "uptime", "nodes", "inauction"],
    'args': {
      'start_time': 0,
      'end_time': 150,
      'dx': 10
    }
  },
  'SC13A': {
    'measurements': 'sc13a-cbba-device-node-error-3-v5-2022-06-23T17:10:21.351Z',
    'metrics': ["payload", "uptime", "nodes", "inauction"],
    'args': {
      'start_time': 300,
      'end_time': None,
      'dx': 10
    }
  },
  'SC13B': {
    'measurements': 'sc13b-cbba-device-node-error-3-v5-2022-06-23T17:22:47.554Z',
    'metrics': ["payload", "uptime", "nodes", "inauction"],
    'args': {
      'start_time': 300,
      'end_time': None,
      'dx': 10
    }
  },
  'F-SC1': {
    'measurements': 'sc1-v0-2022-07-24T19:36:49.937Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 180,
      'dx': 10
    }
  },
  'F-SC2': {
    'measurements': 'sc2-v0-2022-07-24T19:36:50.132Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 180,
      'dx': 10
    }
  },
  'F-SIMA-V0': {
    'measurements': 'rec-fail-v0-2022-07-24T19:36:50.117Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 200,
      'dx': 10
    }
  },
  'F-SIMA-V1': {
    'measurements': 'rec-fail-v1-2022-07-24T19:36:49.981Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 200,
      'dx': 10
    }
  },
  'F-SIMB-V0': {
    'measurements': 'bad-balancing-v0-2022-07-24T19:36:50.055Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 80,
      'dx': 10
    }
  },
  'F-SIMB-V1': {
    'measurements': 'bad-balancing-v1-2022-07-24T19:36:50.204Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 80,
      'dx': 10
    }
  },
  'F-SIMC-V1': {
    'measurements': 'mem-error-nodes-lim-v1-2022-07-24T19:36:49.926Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 300,
      'dx': 10
    }
  },
  'F-SIMC-V2': {
    'measurements': 'mem-error-nodes-lim-v2-2022-07-24T19:36:50.080Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 300,
      'dx': 10
    }
  },
  'F-SIMD-V3': {
    'measurements': 'msc-fail-v3-2022-07-24T19:36:49.940Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 120,
      'dx': 10
    }
  },
  'F-SIMD-V4': {
    'measurements': 'msc-fail-v4-2022-07-24T19:36:50.167Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 120,
      'dx': 10
    }
  },
  'F-SIME-V4': {
    'measurements': 'device-node-error-2-v4-2022-07-24T19:36:50.181Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 300,
      'dx': 10
    }
  },
  'F-SIME-V5': {
    'measurements': 'device-node-error-2-v5-2022-07-24T19:36:50.214Z',
    'metrics': ["payload", "uptime", "nodes"],
    'args': {
      'start_time': 0,
      'end_time': 300,
      'dx': 10
    }
  }
}

config_metrics = {
  'nodes': {
    'file': 'device-nr-nodes',
    'plot_title': "Number of nodes allocated per device",
    'plot_type': "heatmap"
  }, 
  'payload': {
    'file': 'device-payloads',
    'plot_title': 'Payload Size (tasks)',
    'plot_type': "xy"
  }, 
  'uptime': {
    'file': 'device-uptime',
    'plot_title': 'Uptime (s)',
    'plot_type': "heatmap"
  },
  'usedram': {
    'file': 'device-used-ram',
    'plot_title': 'Used RAM (Kbytes)',
    'plot_type': "xy"
  }, 
  'freeflash': {
    'file': 'device-free-flash',
    'plot_title': 'Free flash (Mbytes)',
    'plot_type': "xy"
  }, 
  'usedflash': {
    'file': 'device-used-flash',
    'plot_title': 'Used script memory (Kbytes)',
    'plot_type': "xy"
  }, 
  'inauction': {
    'file': 'device-in-auction',
    'plot_title': 'Device in auction',
    'plot_type': "heatmap"
  }, 
  'update': {
    'file': 'device-update',
    'plot_title': 'AC signal',
    'plot_type': "heatmap"
  }, 
}
