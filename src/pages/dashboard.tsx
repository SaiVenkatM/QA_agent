//TODO: this should just be a standard dashboard, rework it

import * as React from 'react';
//import { useState } from 'react';
import { SignIn, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { api } from '~/lib/api';

import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import LayersIcon from '@mui/icons-material/Layers';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
//import { mainListItems, secondaryListItems } from './listItems';
import Deposits from './Deposits';
import Title from './Title';
//import Orders from './Orders';

import { makeStyles } from "@griffel/react";
import {
    AndroidMotionEventAction,
    AndroidMotionEventButton,
    ScrcpyPointerId,
} from "@yume-chan/scrcpy";
import { MouseEvent, PointerEvent, useEffect, useState } from "react";
import { STATE } from "./state";


function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

const useClasses = makeStyles({
  video: {
      transformOrigin: "center center",
      touchAction: "none",
  },
});

function handleWheel(e: WheelEvent) {
  if (!STATE.client) {
      return;
  }

  STATE.fullScreenContainer!.focus();
  e.preventDefault();
  e.stopPropagation();

  const { x, y } = STATE.clientPositionToDevicePosition(e.clientX, e.clientY);
  STATE.client!.controlMessageWriter!.injectScroll({
      screenWidth: STATE.client!.screenWidth!,
      screenHeight: STATE.client!.screenHeight!,
      pointerX: x,
      pointerY: y,
      scrollX: -e.deltaX / 100,
      scrollY: -e.deltaY / 100,
      buttons: 0,
  });
}

const MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON = [
  AndroidMotionEventButton.Primary,
  AndroidMotionEventButton.Tertiary,
  AndroidMotionEventButton.Secondary,
  AndroidMotionEventButton.Back,
  AndroidMotionEventButton.Forward,
];

function injectTouch(
  action: AndroidMotionEventAction,
  e: PointerEvent<HTMLDivElement>
) {
  if (!STATE.client) {
      return;
  }

  const { pointerType } = e;
  let pointerId: bigint;
  if (pointerType === "mouse") {
      // Android 13 has bug with mouse injection
      // https://github.com/Genymobile/scrcpy/issues/3708
      pointerId = ScrcpyPointerId.Finger;
  } else {
      pointerId = BigInt(e.pointerId);
  }

  const { x, y } = STATE.clientPositionToDevicePosition(e.clientX, e.clientY);

  const messages = STATE.hoverHelper!.process({
      action,
      pointerId,
      screenWidth: STATE.client.screenWidth!,
      screenHeight: STATE.client.screenHeight!,
      pointerX: x,
      pointerY: y,
      pressure: e.pressure,
      actionButton: MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON[e.button],
      // `MouseEvent.buttons` has the same order as Android `MotionEvent`
      buttons: e.buttons,
  });
  for (const message of messages) {
      STATE.client.controlMessageWriter!.injectTouch(message);
  }
}

function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
  if (!STATE.client) {
      return;
  }

  STATE.fullScreenContainer!.focus();
  e.preventDefault();
  e.stopPropagation();

  e.currentTarget.setPointerCapture(e.pointerId);
  injectTouch(AndroidMotionEventAction.Down, e);
}

function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
  if (!STATE.client) {
      return;
  }

  e.preventDefault();
  e.stopPropagation();
  injectTouch(
      e.buttons === 0
          ? AndroidMotionEventAction.HoverMove
          : AndroidMotionEventAction.Move,
      e
  );
}

function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
  if (!STATE.client) {
      return;
  }

  e.preventDefault();
  e.stopPropagation();
  injectTouch(AndroidMotionEventAction.Up, e);
}

function handlePointerLeave(e: PointerEvent<HTMLDivElement>) {
  if (!STATE.client) {
      return;
  }

  e.preventDefault();
  e.stopPropagation();
  // Because pointer capture on pointer down, this event only happens for hovering mouse and pen.
  // Release the injected pointer, otherwise it will stuck at the last position.
  injectTouch(AndroidMotionEventAction.HoverExit, e);
  injectTouch(AndroidMotionEventAction.Up, e);
}

function handleContextMenu(e: MouseEvent<HTMLDivElement>) {
  e.preventDefault();
}

export function VideoContainer() {
  const classes = useClasses();

  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
      STATE.setRendererContainer(container);

      if (!container) {
          return;
      }

      container.addEventListener("wheel", handleWheel, {
          passive: false,
      });

      return () => {
          container.removeEventListener("wheel", handleWheel);
      };
  }, [container]);

  return (
      <div
          ref={setContainer}
          className={classes.video}
          style={{
              width: STATE.width,
              height: STATE.height,
              transform: `translate(${
                  (STATE.rotatedWidth - STATE.width) / 2
              }px, ${(STATE.rotatedHeight - STATE.height) / 2}px) rotate(${
                  STATE.rotation * 90
              }deg)`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onContextMenu={handleContextMenu}
      />
  );
}


function Orders() {
  const { isLoaded, isSignedIn, user} = useUser();
  
  const {data, isLoading} = api.tests.getAllTests.useQuery();
  if (isLoading) return <div>Loading...</div>
  if (!isSignedIn) return <div>not yet</div>
  if (isSignedIn) return <div>good</div>
  // if (isLoading) return <div>Loading</div>
  //if (!data) return <div>dataError</div>


  
  //if (isLoading) return <div>Loading...</div>
//   if (!data) return <div>          < div className="flex justify-center">
//   <SignInButton />
// </div></div>;

  return (
    
    <React.Fragment>
      <Title>Tests</Title>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Last Updated</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Sale Amount</TableCell>
          </TableRow>
        </TableHead>
        {isSignedIn &&
        <TableBody>
          {[...data]?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.updatedAt?.toLocaleString()}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.duration}</TableCell>
              <TableCell align="right">{`$${row.amount}`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
}
      </Table>
      <Link color="primary" href="#" onClick={preventDefault} sx={{ mt: 3 }}>
        See more orders
      </Link>
    </React.Fragment>
    
  );
}

export const mainListItems = (
  <React.Fragment>
    <ListItemButton>
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Dashboard" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <ExitToAppIcon />
      </ListItemIcon>
      <ListItemText primary="Sign Out" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <ExitToAppIcon />
      </ListItemIcon>
       <SignInButton />
    </ListItemButton>
  
  </React.Fragment>
);

const secondaryListItems = (
  <React.Fragment>
    <ListSubheader component="div" inset>
      Saved reports
    </ListSubheader>
    <ListItemButton>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Current month" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Last quarter" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Year-end sale" />
    </ListItemButton>
  </React.Fragment>
);

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="www.google.com">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const drawerWidth: number = 240;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

export default function Dashboard() {
  // const { isLoaded, isSignedIn, user} = useUser();
  
  // const {data, isLoading} = api.tests.getAllTests.useQuery();
  // if (!isSignedIn) return <div>not yet</div>
 //if (isSignedIn) return <div>good</div>
//if (isLoading) return <div>Loading</div>
  //if (!data) return <div>bad</div>
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: '24px', // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Dashboard
            </Typography>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            {mainListItems}
            <Divider sx={{ my: 1 }} />
            {secondaryListItems}
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* Chart */}
              <Grid item xs={12} md={8} lg={9}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <VideoContainer />
                </Paper>
              </Grid>
              
              {/* Recent Orders */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <Orders />
                </Paper>
              </Grid>
            </Grid>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}