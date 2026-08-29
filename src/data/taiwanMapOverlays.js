// All locations share the 0 0 1000 1295 coordinate system from
// @svg-maps/taiwan. Reuse these overlays instead of redrawing a location in
// individual games, so the same coast, port, island, or reference cannot drift.
export const taiwanCoastlineGeometry = {
  'tw-coast-north': 'M 824 367 L 834 360 L 854 331 L 866 325 L 886 323 L 906 348 L 914 348 L 918 359 L 970 374 L 974 396 L 982 400',
  'tw-coast-west': 'M 824 367 L 782 376 L 749 392 L 737 404 L 717 436 L 709 452 L 710 460 L 688 500 L 674 504 L 665 516 L 656 520 L 644 552 L 620 580 L 601 628 L 582 652 L 579 668 L 563 684 L 548 720 L 519 764 L 509 800 L 509 828 L 504 836 L 510 844 L 506 852 L 514 876 L 505 880 L 498 892 L 502 896 L 490 920 L 493 932 L 487 936 L 492 944 L 487 948 L 497 956 L 487 960 L 486 968 L 513 984 L 510 988 L 525 1028 L 525 1044 L 537 1068 L 536 1084 L 552 1100 L 551 1108 L 559 1120',
  'tw-coast-east': 'M 982 400 L 990 400 L 994 408 L 972 420 L 949 452 L 948 508 L 953 516 L 965 520 L 956 524 L 959 540 L 952 548 L 955 556 L 939 572 L 936 608 L 908 640 L 895 668 L 894 676 L 900 688 L 869 804 L 856 884 L 841 912 L 838 944 L 824 960 L 806 1004 L 784 1028 L 782 1044 L 741 1080 L 721 1116 L 706 1160',
  'tw-coast-south': 'M 559 1120 L 602 1143 L 622 1162 L 650 1223 L 654 1264 L 698 1264 L 702 1255 L 706 1160',
}

export const taiwanPortPointGeometry = {
  'tw-port-keelung': { x: 930, y: 373 },
  'tw-port-taichung': { x: 603, y: 624 },
  'tw-port-kaohsiung': { x: 536, y: 1063 },
  'tw-port-hualien': { x: 885, y: 700 },
  'tw-coast-hengchun': { x: 675, y: 1185 },
}

export const taiwanLocationPointGeometry = {
  'tw-location-taiwan-strait': { x: 475, y: 735 },
  'tw-location-pacific': { x: 955, y: 760 },
  'tw-location-east-china-sea': { x: 770, y: 215 },
  'tw-location-bashi-channel': { x: 760, y: 1270 },
  'tw-location-green-island': { x: 860, y: 1080 },
  'tw-location-orchid-island': { x: 877, y: 1254 },
}

export const taiwanTropicGeometry = 'M 445 845 L 955 805'
