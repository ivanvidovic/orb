// Camera-only pivots from sleeve cross-section bounds at each placement height.
// Model coordinates, before the viewer vertical offset. Print anchors are unchanged.
export const SLEEVE_CAMERA_PIVOTS={
  "mens-tee": {
    "leftshoulder": [
      0.23228015611880834,
      0.49624568917361056,
      -0.024887201087210792
    ],
    "rightshoulder": [
      -0.2334163185749768,
      0.49962338843157916,
      -0.027197697831829598
    ]
  },
  "womens-tee": {
    "leftshoulder": [
      0.2283987609950479,
      0.5321842965763709,
      -0.0410173956677954
    ],
    "rightshoulder": [
      -0.22700116437020768,
      0.5369037485854522,
      -0.038847122720997745
    ]
  },
  "mens-hoodie": {
    "leftshoulder": [
      0.2011529018010179,
      0.4270164819403237,
      -0.008118682599824782
    ],
    "rightshoulder": [
      -0.19176922823327175,
      0.4249378572850492,
      -0.010431261427845777
    ],
    "leftwrist": [
      0.22573486470791163,
      0.11767710833109325,
      0.020373286527261565
    ],
    "rightwrist": [
      -0.22941651009134073,
      0.1207283345122775,
      0.0283491106211467
    ]
  },
  "womens-hoodie": {
    "leftshoulder": [
      0.17886740368506254,
      0.44519633333002995,
      0.00977849100190956
    ],
    "rightshoulder": [
      -0.1822385445983949,
      0.4450285091963148,
      0.011082247153502582
    ],
    "leftwrist": [
      0.22064431188901712,
      0.15222860747765252,
      0.048377576168967866
    ],
    "rightwrist": [
      -0.2281738075588946,
      0.15171328088103103,
      0.054805164557881765
    ]
  }
};

// Conservative clearance for close orbiting around an interior pivot.
export const SLEEVE_CAMERA_CLEARANCE={
  "mens-tee": {
    "leftshoulder": 0.12094652188959189,
    "rightshoulder": 0.12227285943514248
  },
  "womens-tee": {
    "leftshoulder": 0.09982081839857548,
    "rightshoulder": 0.0999392955863708
  },
  "mens-hoodie": {
    "leftshoulder": 0.10572839757785536,
    "rightshoulder": 0.10693817498252164,
    "leftwrist": 0.09044475816739592,
    "rightwrist": 0.0843838419561975
  },
  "womens-hoodie": {
    "leftshoulder": 0.09053227022014662,
    "rightshoulder": 0.0896351225919996,
    "leftwrist": 0.08752947707015357,
    "rightwrist": 0.08123936527176508
  }
};
