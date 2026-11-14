/*
 * CBOMkit
 * Copyright (C) 2024 PQCA
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to you under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.ibm.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import app.bootstrap.core.cqrs.ICommand;
import app.bootstrap.core.cqrs.ICommandHandler;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class CommandBusTest {

    private record TestCommand() implements ICommand {}

    private static final class SelfRemovingHandler implements ICommandHandler {
        private final CommandBus bus;

        private SelfRemovingHandler(CommandBus bus) {
            this.bus = bus;
        }

        @Override
        public void handle(ICommand command) {
            bus.unregister(this, TestCommand.class);
        }
    }

    @Test
    void completesDispatchWhenOnlyHandlerUnregistersItself() throws Exception {
        CommandBus bus = new CommandBus();
        bus.register(new SelfRemovingHandler(bus), TestCommand.class);

        assertThat(bus.sendSync(new TestCommand())).isTrue();
        assertThat(bus.sendSync(new TestCommand())).isFalse();
    }

    @Test
    void stillInvokesRemainingHandlerAfterSelfUnregistration() throws Exception {
        CommandBus bus = new CommandBus();
        AtomicInteger calls = new AtomicInteger();
        bus.register(new SelfRemovingHandler(bus), TestCommand.class);
        bus.register(command -> calls.incrementAndGet(), TestCommand.class);

        assertThat(bus.sendSync(new TestCommand())).isTrue();
        assertThat(calls.get()).isEqualTo(1);

        assertThat(bus.sendSync(new TestCommand())).isTrue();
        assertThat(calls.get()).isEqualTo(2);
    }
}
