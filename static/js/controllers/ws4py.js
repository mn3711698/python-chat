// Generated by CoffeeScript 1.6.3
var chatApp, ws;

ws = null;

chatApp = angular.module("chatApp", []);

chatApp.factory("ChatService", function() {
  var service;
  service = {};
  service.setOnmessage = function(callback) {
    return service.onmessage = callback;
  };
  service.setOnopen = function(callback) {
    return service.onopen = callback;
  };
  service.connect = function() {
    if (service.ws) {
      return;
    }
    ws = new WebSocket("ws://" + location.hostname + ":9000");
    ws.onopen = function(event) {
      return service.onopen(event);
    };
    ws.onmessage = function(event) {
      return service.onmessage(event);
    };
    return service.ws = ws;
  };
  return service;
});

chatApp.controller("Ctrl", [
  '$scope', 'ChatService', function($scope, ChatService) {
    $scope.templateUrl = "/static/partials/ws4py.html";
    $scope.user = {};
    $scope.rooms = [];
    $scope.members = {};
    $scope.history = {};
    $scope.users = {};
    $scope.visitors = {};
    $scope.send = function(type, oid) {
      var body, msg;
      body = this.text;
      if ((body != null) && body.length > 0) {
        msg = {
          path: 'message',
          type: type,
          oid: parseInt(oid),
          body: body
        };
        console.log('send:', msg);
        ws.send(JSON.stringify(msg));
        return this.text = "";
      }
    };
    ChatService.setOnopen(function() {
      var msg, token;
      token = $.cookie('token');
      msg = {};
      if (token != null) {
        msg.path = 'online';
        msg.type = 'user';
        msg.token = token;
      } else {
        msg.path = 'create_client';
        msg.type = 'user';
      }
      ws.send(JSON.stringify(msg));
      return console.log('Opened');
    });
    ChatService.setOnmessage(function(event) {
      var data, member, msg, room, _i, _j, _len, _len1, _ref, _ref1;
      data = JSON.parse(event.data);
      console.log('<<DATA>>:', data);
      switch (data.path) {
        case 'create_client':
          msg = {
            path: 'online',
            type: 'user'
          };
          msg.token = data.token;
          $.cookie('token', data.token);
          ws.send(JSON.stringify(msg));
          break;
        case 'online':
          if (data.reset != null) {
            $.removeCookie('token');
            msg = {
              path: 'create_client',
              type: 'user'
            };
            ws.send(JSON.stringify(msg));
            console.log('Reset');
          } else {
            $scope.user.oid = data.oid;
            $scope.user.name = data.name;
            msg = {
              path: 'rooms'
            };
            ws.send(JSON.stringify(msg));
            console.log('Onlined');
          }
          break;
        case 'rooms':
          $scope.rooms = data.rooms;
          _ref = data.rooms;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            room = _ref[_i];
            msg = {
              path: 'join',
              oid: room.oid
            };
            ws.send(JSON.stringify(msg));
          }
          console.log('rooms:', $scope.rooms);
          break;
        case 'join':
          msg = {
            path: 'members',
            oid: data.oid
          };
          ws.send(JSON.stringify(msg));
          msg = {
            path: 'history',
            type: 'room',
            oid: data.oid
          };
          ws.send(JSON.stringify(msg));
          console.log('Joined:', data);
          break;
        case 'members':
          $scope.members[data.oid] = {};
          _ref1 = data.members;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            member = _ref1[_j];
            $scope.members[data.oid][member.oid] = member;
          }
          console.log('Get members:', $scope.members, data.members);
          break;
        case 'history':
          $scope.history[data.oid] = data.messages;
          console.log('Get history:', data.oid, data.messages);
          break;
        case 'presence':
          switch (data.to_type) {
            case 'room':
              switch (data.action) {
                case 'join':
                  $scope.members[data.to_id][data.member.oid] = data.member;
                  break;
                case 'leave':
                  delete $scope.members[data.to_id][data.member.oid];
              }
          }
          break;
        case 'message':
          switch (data.to_type) {
            case 'room':
              console.log('received message:', data);
              $scope.history[data.to_id].push(data);
          }
          console.log('Message.type:', data.to_type);
      }
      return $scope.$apply();
    });
    ChatService.connect();
    return 'ok';
  }
]);
